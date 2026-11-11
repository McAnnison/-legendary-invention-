# StudyBeat — Product Vision and Scope

**Status:** V1 direction — baseline for product discovery and implementation  
**Version:** 1.0  
**Date:** 11 November 2026  
**Repository:** [McAnnison/-legendary-invention-](https://github.com/McAnnison/-legendary-invention-)

## 1. Product vision

**Turn what you study into what you remember.**

StudyBeat is an AI-powered learning companion that transforms a learner's study materials into accurate, memorable songs. It helps learners convert dense notes, lecture slides and reading materials into structured audio study resources that make revision more engaging and easier to revisit.

StudyBeat is not simply a music generator. Its defining value is the connection between **source-grounded educational content, memorable musical presentation and active revision**. A song that sounds good but teaches incorrect information is a product failure.

## 2. The problem

Learners often work with large volumes of text-heavy material and have to repeatedly reread notes to understand and retain important concepts. Conventional revision can become repetitive, difficult to sustain and poorly suited to learners who benefit from audio-based reinforcement.

Existing general-purpose music generation tools are not designed to preserve the accuracy, terminology, structure and relationships in academic material. A learning product must therefore do more than place keywords into lyrics: it must identify what matters, preserve meaning, make the generated content reviewable and help learners use it for revision.

## 3. Target users

### Primary audience — students

- University and tertiary students who revise from lecture notes, slides and course documents.
- Senior secondary students who need engaging ways to revisit topics.
- Students who prefer listening alongside or instead of repeated reading.

### Secondary audience — independent learners

People studying professional, technical or personal-development subjects who have source materials they want to revisit in audio form.

### Initial market and language

The product should be designed with Ghanaian learners and practical mobile-data/device constraints in mind, while remaining suitable for wider markets. **English is the initial V1 language.** Twi, Ga, Ewe and other languages are future expansion candidates, not launch promises.

## 4. Product promise

A learner should be able to:

1. Upload a supported study document.
2. See what StudyBeat extracted from it.
3. Correct or approve the important concepts.
4. Choose a music style and a small set of generation preferences.
5. Generate lyrics that preserve the source material's meaning.
6. Generate or attach suitable audio, listen and save it.
7. Return to the material and song for later revision.

The learner remains in control: generated educational content must be reviewable, source-linked where practical, and regenerable when it is inaccurate or unsuitable.

## 5. Product principles

1. **Accuracy before catchiness.** Educational correctness outranks rhyme, genre or musical complexity.
2. **Source-grounded generation.** Do not invent facts, formulas, examples or citations that are not supported by the uploaded material unless clearly labelled as external explanation.
3. **Learner control.** Show extracted concepts and lyrics before treating a generated song as ready for study.
4. **Transparent limitations.** Tell users when a document could not be fully read or when a generation provider cannot satisfy a request.
5. **Useful audio, not novelty audio.** Songs should be intelligible, structured and suitable for repeated listening.
6. **Mobile-first simplicity.** Make the main learning journey usable on Android and on constrained connections.
7. **Privacy by design.** Study documents and generated audio are private user content unless the user explicitly chooses to share them in a future release.

## 6. V1 product scope

### Included in V1

- Account registration, sign-in and basic profile/preferences.
- Android-first mobile experience.
- Upload and management of PDF, DOCX, PPTX and TXT study materials.
- File validation, secure storage and asynchronous processing.
- Text extraction and normalisation for supported document types.
- Extraction of topics, definitions, key facts, processes, formulas and important terminology.
- A review step where users can inspect and correct extracted concepts.
- AI-assisted lyric generation grounded in the reviewed concepts.
- A limited set of music styles/genres and configurable song length.
- Audio generation through replaceable provider integrations, subject to provider capability and cost validation.
- Song playback, pause/resume, seeking and basic playback controls.
- A personal library connecting each song to its source material.
- Generation status, retry/error handling and basic usage visibility.
- Basic learning support such as replaying songs and tracking listening activity.

### Explicitly out of scope for V1

- A public social network, public profiles, comments or follower systems.
- Collaborative classrooms, group playlists or multiplayer features.
- A full AI tutor or open-ended tutoring chat.
- Institutional administration, lecturer dashboards or school management.
- Training a proprietary foundation model or music-generation model.
- A full-featured web application; the initial client is Android-first.
- Multiple simultaneous providers for every AI/audio capability.
- Guaranteed support for handwritten notes, every scanned PDF, complex scientific diagrams or every mathematical notation format.
- Guaranteed singing in Twi, Ga, Ewe or other languages at launch.
- Offline generation; offline playback/downloads can be evaluated after core reliability and licensing are validated.
- Automatic claims that listening alone improves grades or guarantees retention.

## 7. V1 success definition

V1 is successful when a target learner can reliably move from a supported document to a source-grounded, reviewable song and use that song again for revision.

Initial product measures:

- **Activation:** percentage of new users who successfully upload a supported document and reach a generated song.
- **Processing reliability:** percentage of supported uploads that complete extraction without unrecoverable failure.
- **Content quality:** concept coverage and factual correctness in a reviewed evaluation set.
- **Generation reliability:** percentage of generation jobs that complete successfully, with recoverable errors handled clearly.
- **Time to value:** time from upload to a playable song.
- **Repeat use:** percentage of users who replay or revisit a song/material.
- **Learning usefulness:** learner-reported usefulness and, in a pilot, change between a short pre-test and post-test. This is an evaluation measure, not a guaranteed outcome.
- **Unit economics:** cost per successfully generated song and cost per active learner.

Targets should be set after a technical prototype and a small learner pilot establish realistic baselines. Do not invent performance targets before provider and document-processing tests.

## 8. Product assumptions and decisions to validate

These are working defaults so engineering can proceed without pretending unanswered questions are settled:

| Decision | V1 working default | Validation needed |
|---|---|---|
| Platform | Android first | Confirm device coverage and whether a web companion is needed |
| Primary user | University and secondary students | Interview students across study levels |
| Initial language | English | Validate pronunciation and subject terminology |
| Audio experience | AI-generated vocals with instrumental backing where provider quality permits | Benchmark singing quality, licensing, latency and cost; provide a fallback if vocals are unavailable |
| Music selection | Small curated genre set | Test preferences with learners |
| Business model | Not fixed in this PRD | Test willingness to pay and per-song cost |
| Team | Not fixed | Confirm available contributors and delivery capacity |
| Connectivity | Online generation; resilient uploads and clear progress/error states | Test on typical mobile networks |

## 9. Product boundary

StudyBeat owns the user experience, educational content pipeline, source-to-concept traceability, quality checks, job orchestration, library and usage records. External AI and audio services are replaceable providers behind backend interfaces. Provider choice must not dictate the product's domain model or expose provider credentials to the mobile application.

## 10. Definition of a V1 release

A release candidate must demonstrate:

- A user can securely register and sign in.
- A user can upload and process each supported file type within documented limits.
- Extraction failures and unsupported content are communicated clearly.
- The user can review and edit extracted concepts.
- Generated lyrics are traceable to the source concepts and pass the agreed quality checks.
- Audio generation either succeeds or returns a clear, recoverable failure; no fake success state is shown.
- Songs are saved to the correct user's library and cannot be accessed by other users.
- Playback works on supported Android devices.
- Usage, privacy, deletion, security and operational procedures are documented.
- The team has evaluated the actual cost and licensing constraints of its chosen providers.

## 11. What we will not compromise

The central product differentiator is trustworthy transformation of learning content into useful audio revision material. If a trade-off is required, preserve educational accuracy, user privacy and reliable playback before adding more genres, languages or social features.
