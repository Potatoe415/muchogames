// What one seat may see when it chooses a card: its own hand, dummy once it
// is down, and the public record. Declarer playing dummy sees from its own
// seat. Robots never get the hidden hands.
export function playView(deal, state, seat, level) {
  const { contract, dummy } = state;
  const eyes = seat === dummy ? contract.declarer : seat;
  const hands = { [eyes]: state.remaining[eyes] };
  if (state.dummyVisible || seat === dummy)
    hands[dummy] = state.remaining[dummy];
  return {
    seat,
    level,
    contract,
    trump: state.trump,
    declarer: contract.declarer,
    dummy,
    hands,
    trick: state.current.plays,
    tricks: state.tricks.map(({ leader, plays, winner }) => ({
      leader,
      plays,
      winner
    })),
    won: state.won,
    counts: state.remaining.map((cards) => cards.length),
    dealer: deal.dealer,
    vul: deal.vul,
    calls: deal.calls
  };
}
