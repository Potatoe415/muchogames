const MAX_AVATAR_BYTES = 25 * 1024;
const AVATAR_MAX_DIMENSION_PX = 256;
const AVATAR_MIN_DIMENSION_PX = 64;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const crop = {
  image: null,
  zoom: MIN_ZOOM,
  offsetX: 0,
  offsetY: 0,
  drag: null,
  resolve: null
};

export function initAvatarCrop() {
  const stage = document.getElementById("profile-avatar-crop-stage");
  const zoom = document.getElementById("profile-avatar-crop-zoom");
  const cancel = document.getElementById("profile-avatar-crop-cancel");
  const apply = document.getElementById("profile-avatar-crop-apply");
  const backdrop = document.querySelector(
    '[data-id="profile-avatar-crop-backdrop"]'
  );
  if (!stage || !zoom || !cancel || !apply) return;

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  zoom.addEventListener("input", onZoomInput);
  cancel.addEventListener("click", () => finish(null));
  apply.addEventListener("click", applyCrop);
  backdrop?.addEventListener("click", () => finish(null));
  document.addEventListener("keydown", onEscape);
}

export function openAvatarCrop(image, copy) {
  return new Promise((resolve) => {
    crop.image = image;
    crop.resolve = resolve;
    crop.zoom = MIN_ZOOM;
    applyCropCopy(copy);
    const img = document.getElementById("profile-avatar-crop-image");
    const zoom = document.getElementById("profile-avatar-crop-zoom");
    const dialog = document.getElementById("profile-avatar-crop");
    img.src = image.src;
    zoom.value = String(MIN_ZOOM);
    dialog.hidden = false;
    centerImage();
    renderCropImage();
  });
}

export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function applyCropCopy(copy) {
  setText("profile-avatar-crop-title", copy.cropTitle);
  setText("profile-avatar-crop-cancel", copy.cropCancel);
  setText("profile-avatar-crop-apply", copy.cropApply);
  setText("profile-avatar-crop-zoom-label", copy.cropZoom);
}

function setText(dataId, text) {
  const node = document.querySelector(`[data-id="${dataId}"]`);
  if (node) node.textContent = text;
}

function stageSize() {
  const stage = document.getElementById("profile-avatar-crop-stage");
  return stage?.clientWidth || 280;
}

function coverScale() {
  const side = Math.min(crop.image.width, crop.image.height);
  return stageSize() / side;
}

function displayScale() {
  return coverScale() * crop.zoom;
}

function centerImage() {
  const shownW = crop.image.width * displayScale();
  const shownH = crop.image.height * displayScale();
  const size = stageSize();
  crop.offsetX = (size - shownW) / 2;
  crop.offsetY = (size - shownH) / 2;
}

function clampOffsets() {
  const size = stageSize();
  const shownW = crop.image.width * displayScale();
  const shownH = crop.image.height * displayScale();
  crop.offsetX = clamp(crop.offsetX, size - shownW, 0);
  crop.offsetY = clamp(crop.offsetY, size - shownH, 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderCropImage() {
  const img = document.getElementById("profile-avatar-crop-image");
  const scale = displayScale();
  img.style.width = `${crop.image.width * scale}px`;
  img.style.height = `${crop.image.height * scale}px`;
  img.style.transform = `translate(${crop.offsetX}px, ${crop.offsetY}px)`;
}

function onZoomInput(event) {
  const nextZoom = clamp(Number(event.target.value), MIN_ZOOM, MAX_ZOOM);
  const size = stageSize();
  const scale = displayScale();
  const cx = (size / 2 - crop.offsetX) / scale;
  const cy = (size / 2 - crop.offsetY) / scale;
  crop.zoom = nextZoom;
  const nextScale = displayScale();
  crop.offsetX = size / 2 - cx * nextScale;
  crop.offsetY = size / 2 - cy * nextScale;
  clampOffsets();
  renderCropImage();
}

function onPointerDown(event) {
  event.currentTarget.setPointerCapture(event.pointerId);
  crop.drag = {
    x: event.clientX - crop.offsetX,
    y: event.clientY - crop.offsetY
  };
}

function onPointerMove(event) {
  if (!crop.drag) return;
  crop.offsetX = event.clientX - crop.drag.x;
  crop.offsetY = event.clientY - crop.drag.y;
  clampOffsets();
  renderCropImage();
}

function endDrag() {
  crop.drag = null;
}

function onEscape(event) {
  const dialog = document.getElementById("profile-avatar-crop");
  if (event.key === "Escape" && dialog && !dialog.hidden) {
    finish(null);
  }
}

const AVATAR_THUMB_PX = 48;

function applyCrop() {
  const scale = displayScale();
  const size = stageSize();
  const region = {
    sx: -crop.offsetX / scale,
    sy: -crop.offsetY / scale,
    sSize: size / scale
  };
  finish({
    avatar: compressCroppedImage(crop.image, region),
    thumb: encodeJpeg(crop.image, region, AVATAR_THUMB_PX, 0.5)
  });
}

function finish(dataUrl) {
  const dialog = document.getElementById("profile-avatar-crop");
  const resolve = crop.resolve;
  dialog.hidden = true;
  crop.resolve = null;
  crop.image = null;
  crop.drag = null;
  resolve?.(dataUrl);
}

function compressCroppedImage(image, region) {
  let size = AVATAR_MAX_DIMENSION_PX;
  let quality = 0.85;
  let dataUrl = encodeJpeg(image, region, size, quality);

  while (estimateDataUrlBytes(dataUrl) > MAX_AVATAR_BYTES) {
    if (quality > 0.4) {
      quality -= 0.15;
    } else if (size > AVATAR_MIN_DIMENSION_PX) {
      size = Math.max(AVATAR_MIN_DIMENSION_PX, Math.round(size * 0.75));
      quality = 0.7;
    } else {
      break;
    }
    dataUrl = encodeJpeg(image, region, size, quality);
  }

  return dataUrl;
}

function encodeJpeg(image, region, size, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.drawImage(
    image,
    region.sx,
    region.sy,
    region.sSize,
    region.sSize,
    0,
    0,
    size,
    size
  );
  return canvas.toDataURL("image/jpeg", quality);
}

function estimateDataUrlBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round((base64.length * 3) / 4);
}
