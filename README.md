# Nikhil Pudtha — Portfolio

My personal portfolio: projects, resume, and hobbies. Almost everything on the page reacts to you, so hover over it, click it, and scroll around.

**Live site:** https://nipu345.github.io/Nikhil-Pudtha-Portfolio/

```
_  _ _ _  _ _  _ _ _       ___  _  _ ___  ___ _  _ ____
|\ | | |_/  |__| | |       |__] |  | |  \  |  |__| |__|
| \| | | \_ |  | | |___    |    |__| |__/  |  |  | |  |
```

## The idea behind it

The site started as a clean, static four-page portfolio: a hero, project cards, a resume, and hobbies. It looked professional but felt like every other portfolio, so I wanted to make it more creative and interactive.

I picked a "data-flow" concept because most of my work is involving pipelines.

It's still plain HTML, CSS, and vanilla JavaScript: no frameworks, no build step, no dependencies. GitHub Pages serves the files exactly as they are in this repo.

## Tour of the site

| Page | What you'll find |
| --- | --- |
| **Home** | A live skill graph. My photo is the hub, skill nodes orbit it, and data packets flow along the edges into the center. |
| **Projects** | Each project drawn as its own animated pipeline, plus a filter to see which projects use a given technology. |
| **Resume** | Education, experience, projects, and skills, with an interactive timeline showing how my roles overlap. |
| **Hobbies** | Lifting, hiking, and coding, with live stats pulled from my GitHub. |

## Interactive features

| Feature | Where | Does |
| --- | --- | --- |
| Skill graph | Home | Nodes lean toward your cursor. Hover one to light up its connections; click it to see projects that use that skill. |
| Pipelines | Projects | Packets flow between the stages of each project while it's in the middle of your screen. |
| Stack filter | Projects | Pick a technology to dim projects that don't use it. Tags on the cards are clickable too. |
| Tilt + spotlight | Projects, Hobbies | Cards tilt toward the cursor and a soft glow follows it. Mouse and trackpad only. |
| Experience timeline | Resume | Roles drawn as bars on a shared month axis with a "now" marker. Hover a bar to highlight its entry; click it to jump there. |
| GitHub activity | Hobbies | Repo count, last push, language mix, and latest repos from the GitHub API. Cached for an hour. |
| Scroll reveals | Everywhere | Sections fade up as they come into view. |
| Page transitions | Everywhere | Pages cross-fade with the nav bar held in place (Chrome, Edge, Safari). |
| Dark mode | Everywhere | Follows your system setting. |

Everything respects **reduced motion**: if your system asks for less animation, the content just shows up.

## Project structure

```
├── index.html      Home / hero with the skill graph
├── projects.html   Projects, pipelines, and the stack filter
├── resume.html     Resume and the experience timeline
├── hobbies.html    Hobbies and the GitHub activity card
├── style.css       All styling; colors and fonts are CSS variables at the top
├── main.js         All interactions, one self-contained block per feature
└── images/         Photos
```

## Running it locally

There's nothing to install. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's next

| Idea | Does |
| --- | --- |
| Terminal mode | A toggle that turns the site into a shell where you can type `ls`, `cat resume`, or `open prism` |
| Project deep dives | A dedicated page per project with architecture diagrams, demos, and what I learned |
| Live project demos | Embed working versions of projects like KBFind's semantic search right on the page |
| Tech blog | Short write-ups on new things I'm learning, like RAG tuning, forecasting models, and AWS deployment ||
| Automated testing | Playwright tests and a GitHub Actions workflow that checks every push before it deploys |

... to be continued

## Security & privacy

- Static site: no backend, no forms, no stored user data, and no API keys.
- The only outside data is GitHub's public repo API. Every value from it is escaped before it goes on the page, so a repo name can't inject HTML or scripts.
- External links open with `rel="noopener noreferrer"`.
