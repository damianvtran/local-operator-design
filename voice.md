# Voice

The register this product speaks in, the words it will not use, and why.

The audience has used a chat assistant. They have not used a build tool. Every
rule below follows from that one sentence.

*Read after [`components.md`](./components.md), before
[`handoff-local-operator-ui.md`](./handoff-local-operator-ui.md). Depends on
nothing else in the kit and nothing else depends on it, so it can also be read
first — but it is last in the sequence because a voice pass is the last thing you
do to a surface, not the first.*

---

## 1. The eight principles

Each principle is stated, then shown with a real before/after from this rebuild.
The "before" strings are all genuine — they shipped.

### V1. Say what happens, and on whose machine

Name the computer, the files, the code. Describe events, not capabilities.

> **Before:** "From casual conversation to complex problem-solving, Local
> Operator agents find creative solutions to real world problems by writing code
> to get around the limitations of existing tools."
>
> **After:** "When a task needs a capability that does not exist, the agent
> writes code to make it. The toolset grows with your to-do list."

The before sentence is 31 words and contains no fact. The after is two sentences
and contains a mechanism and a consequence.

### V2. No jargon noun where an everyday noun works

> **Before:** "Contextual Execution". "Infinite Context". "Interactive CLI
> Interface."
>
> **After:** "Teach it once." / "It writes its own tools."

Feature names that are compound abstract nouns are a category error: they name
an implementation to a reader who is trying to decide whether the thing helps
them.

### V3. No adjective doing a verb's job. Every claim is checkable or it is cut

> **Before:** "your gateway to an emerging ecosystem of community-built agents."
>
> **After:** "The Agent Hub, powered by Radient, is the community shelf of
> taught agents: pull one down, add it to your team."

"Gateway", "emerging", "ecosystem" are three adjectival gestures at a thing. The
replacement says what it is and what you do with it.

### V4. Short sentences. Full stops. One idea per sentence

No em-dash-and-colon cadence. No triplets of synonyms.

> **Before:** "AI agents that seamlessly communicate, delegate tasks, and
> amplify each other's capabilities."
>
> **After:** "No agent works alone." then "Agents hand work to whichever agent
> is best at it."

The triplet is the tell. Three verbs in a row means the writer could not decide
which one was true, so they shipped all three.

### V5. Second person, possessive, and plain negation

"Your files", "your computer". Guarantees phrased as what does **not** happen.

> **Before:** "Empowering humans with local AI assistance."
>
> **After:** "Your files don't leave your computer."

Both grammar patterns — possessive second person, negation-as-guarantee — are
generic and safe to use. The specific nouns are what make the sentence yours.

### V6. Warm, not cute. Quietly confident, never breathless

No exclamation marks in headings or decks.

> **Before:** "Begin your journey with Local Operator in just a few steps."
>
> **After:** "You ask in your own words and it runs on your machine."

"Journey" is brochure-speak: it describes the reader's experience to the reader,
which is presumptuous, and it describes it inaccurately, because installing an
app is not a journey.

### V7. Numbers and names over adjectives

Version numbers, filenames, OS names, model names, times. Set filenames and
version strings in the mono face
([`typography.md` § 4](./typography.md#4-where-mono-is-mandatory-and-where-it-is-forbidden)).

> **Before:** "Loading download…"
>
> **After:** "Checking your platform", followed by the version badge `v0.12.8`
> once resolved.

The before says the software is busy. The after says what it is doing and then
proves it finished with a number.

### V8. Honesty about friction is a voice feature

Install warnings, download sizes, model costs — stated plainly, in the same
register as everything else.

> **Before:** the site said nothing about install warnings, ever.
>
> **After:** "Because the app is new to most computers, macOS may ask you to
> confirm you trust it the first time you open it. That is Gatekeeper doing its
> job. Right-click the app, choose Open, and confirm once; after that it opens
> like any other app."

A product that only describes its happy path is a product the reader stops
trusting the first time something asks them a question. Naming the friction
before it happens is the cheapest trust you will ever buy.

---

## 2. Banned words and phrases

Banned **everywhere** a person can read them: headings, body, buttons, labels,
tooltips, empty states, error messages, alt text, page metadata, structured
data. Not banned in code comments, commit messages or engineering docs — this is
a rule about product copy, not about how engineers talk to each other.

They are grouped by the reason, because the reason is what lets you judge a word
that is not on the list.

### 2.1 Jargon that names the implementation to someone who wants the outcome

| Banned | Why |
|---|---|
| agentic | Industry term of art. A reader who knows it does not need it; one who does not is told nothing. |
| generalist agentic principles | Four abstract words in a row, none of them a claim. |
| contextual execution | Names an internal mechanism as if it were a benefit. |
| infinite context | Names an internal mechanism *and* overclaims — no context is infinite. |
| conversational AI (as a noun phrase) | Category jargon. Say what it does. |
| LLM | Consumer copy. Say "model", or name the model. |
| prompt (as a noun for the user's message) | Say "request" or "ask". "Prompt" is a term from the tool's plumbing. Quoting a user's own words inside a demo is the one exception. |
| dynamic networks, paradigm, synergy, holistic | Words that survive only in decks. |
| workflow needs | Two abstractions pretending to be a customer. |

### 2.2 Adjectives doing a verb's job — unverifiable, so cut

| Banned | Why |
|---|---|
| seamless / seamlessly | Never checkable. It means "we did not think about the seams." |
| robust | An engineer's word for "we hope so". Say what it survives. |
| intelligent (as a product adjective) | Every product claims it; it distinguishes nothing. |
| maximum flexibility, limitless | Unbounded claims are unverifiable by construction. |
| effortless / effortlessly, hassle-free | Describes the reader's feelings to the reader, and is usually false. |
| AI-powered | The whole product is AI. Saying so is filler. |
| magic (as a noun for the product) | The pitch is that the machine did something real, on your files. Calling it magic gives that away. |

### 2.3 Brochure verbs

| Banned | Why |
|---|---|
| empowering / empower | Third-person and abstract. Say what the reader can now do. |
| leverage | Say "use". |
| unlock, unleash, harness | Implies the value was previously caged by the product's own absence. |
| supercharge, turbocharge | Volume, not information. |
| amplify | Same. |
| elevate | Same, with a suit on. |
| transform (as a verb for what the product does) | Overclaims and says nothing. |
| dive in | Faux-casual instruction. Say what to do. |
| revolutionise | Nothing here is a revolution. |
| stay connected | A phrase from a mobile carrier advert. |

### 2.4 Trend words with a shelf life

| Banned | Why |
|---|---|
| cutting-edge, next-generation, game-changer | Each dates the copy to the quarter it was written, and each is a claim about the market rather than about the product. |
| experience the future | See below. |
| ecosystem | Was a metaphor. Is now a filler noun. |
| suite | "A new suite of tools" says "several tools". |
| journey | Brochure-speak for "steps". |
| power of (as in "the power of automation") | Three words that add nothing to "automation". |

### 2.5 Banned structures

| Banned | Why |
|---|---|
| An `X: Y` headline built on an em dash or a colon | The cadence makes every headline sound like the same headline. |
| Any sentence whose subject is "the future" | The product runs today, on the reader's computer. |
| Any passive-voice guarantee — "your data is protected" | A guarantee with no agent is not a guarantee. Say *by what*, or do not say it. |
| Triplets of synonyms | See V4. |
| An exclamation mark in a heading or a deck | One is permitted site-wide, in a 404. It is not used there either. |

### 2.6 Claims that are banned as facts, not as words

No testimonials. No customer names. No logo wall. No placeholder for any of
those. No user counts, download counts, or "trusted by". No repository star
count. No benchmark tables or accuracy percentages. Nothing about being "the
best", "#1", or "revolutionary".

Two of these deserve their reasoning stated, because they get re-added:

- **A star count is a badge, not evidence.** Link the repository, plainly, and
  let a reader who cares click it. Of twenty-one consumer products surveyed for
  this rebuild, zero showed one.
- **An unclaimable privacy guarantee is worse than none.** If the policy commits
  to something narrower than the marketing sentence, the marketing sentence is a
  liability. Change the policy first, or write the narrower true sentence.

---

## 3. Patterns

### Headlines

| Rule | Value |
|---|---|
| Length | Aim for ≤ 40 characters; a headline that needs three lines is a deck |
| Person | Second person, usually possessive: *Your …* |
| Verb | Present tense, active, concrete |
| Accent | **No accent-coloured word in any heading.** The accent has about three spends per screen and a heading is not one. |
| Gradient | Never. |
| Mono | Never. |
| Punctuation | A full stop is allowed and often right. A colon-dash cadence is not. |
| Line breaks | Balance the rag by default; pin a manual break only where the meaning depends on it, and then turn balancing off for that heading |

Two headline formulas are safe to reuse because they are generic: **possessive
second person** ("Your files don't leave your computer") and
**negation-as-guarantee** ("No agent works alone"). The specific nouns are what
must be yours.

### Body

| Rule | Value |
|---|---|
| Measure | 68ch. 62ch in dense panels. 46ch for a deck. |
| Sentence length | Short. One idea each. |
| Paragraph length | Two to four sentences. |
| Person | Second person for what the reader does; third for what the software does. |
| Numbers | Preferred over adjectives, and set in mono when they identify a thing (a version, a size, a filename). |
| Answers | Put the answer in the first sentence. Everything after it is support. |

### Microcopy

Microcopy is where a product's voice is actually judged, because it is read
under load — mid-task, mid-failure, deciding whether to trust a dialog.

| Situation | Pattern | Example |
|---|---|---|
| Action button | Verb + object, no ellipsis | "Download for macOS" |
| Loading | Say what is happening, not that something is | "Checking your platform" — not "Loading…" |
| Success | Confirm the *outcome*, briefly, and revert | "Copied" for ~1.6s, then back to rest |
| Failure | What failed, and what the reader can do instead — in the same calm register | "Download from GitHub" with a sentence saying the release lookup failed |
| Empty state | What goes here, and how to put something here | Never "No items." alone |
| Destructive confirm | Name the thing and the consequence; the verb on the button repeats the action | "Delete" — not "OK" |
| Warning about real friction | State it before it happens, explain why it is normal, give the exact steps | The Gatekeeper paragraph in V8 |

Three microcopy rules that catch most defects:

- **Never make a button say "OK".** A button's label is the sentence the reader
  is agreeing to.
- **Never announce a state the reader cannot act on.** "Something went wrong" is
  not an error message; it is an apology for not writing one.
- **A control's accessible name must say what pressing it will do**, including
  when that changes with state. "Toggle theme" is a static name for a control
  with two destinations; "Switch to dark theme" is the correct one.

---

## 4. How to check a string

Five questions, in order. Any "no" is a rewrite, not a discussion.

1. **Is every claim in it checkable?** Against a fact, a file, a version, a
   licence.
2. **Would the reader recognise every noun?** They have used a chat assistant,
   not a build tool.
3. **Does it contain a banned word or structure?** § 2.
4. **Is it in the second person and the active voice?**
5. **If it is a guarantee, does it name what does the guaranteeing?**

And one for a reviewer rather than a writer: **read it aloud.** The triplets,
the em-dash cadence and the breathless adjectives are all audible before they
are visible.

---

*Derived from `docs/copy.md` § 0 (Voice, and Banned words and phrases) and § 1
(Positioning — what we do not claim), 2026-08-03. The before/after pairs are
quoted from that deck, which cites the shipped source file for each "before".*
