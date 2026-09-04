## Todo

These are rough notes from the developer to keep things in mind to do later in development. These can be questioned with regard to the directive in ARCHITECTURE.md where I want to initially focus on an MVP.

- Set up grammar tips to target when the user misses a specific particle (only particles for now). For example "Clock times take に." would be a hint provided if the answer involves a term of time and the user uses the wrong particle (not "に")
- There's a real sense of frustration when trying to answer a question a second time when the answer and tile bank have lots of tiles. Learning is important, but this might use some redesign.
- for the answer "Osusume wa nan desu ka?" add the note "this is the more natural phrasing as opposed to 'nani ga osusume desu ka'".
- Clicking a tile that was placed removes only that tile, and the next tile clicked goes in that spot.
- Highlight incorrect tile(s) after 2nd incorrect answer, accounting for alternate answers

## Future phase ideas

These ideas are for changes beyond the initial MVP

- For answers with alternates, give a chance to get the best answer.
- Star system:
  - one star: finished with zero incorrect
  - two stars: finished with zero misses
  - three stars: finished all sections with zero misses
- Increased difficulty options
  - 1) (my current preference) totally based on scenarios, thus the content of each dictates difficulty directly
  - 2) more complex sentences or exercise formulation in code
  - 3) utilize user right/wrong frequency to determine what is difficult for player
