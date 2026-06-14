You are helping build Om Daily, a mobile app that teaches Hinduism through interactive learning paths.

Your job is to implement/rebuild Region 1 of the Hinduism world: the Lotus Path.


PROJECT CONTEXT:
App name: Om Daily
Current path: Hinduism World → Region 1 → Lotus Path
Region 1 name: Lotus Path
Region 1 title: Welcome to Hinduism
Region 1 purpose: The user knows nothing. By the end of Region 1, they should understand what Hinduism is, where it came from, why it has no single founder, why it is called Sanātana Dharma, why it is called a way of life, and what basic values like ahiṁsā mean.
Tone: clear, warm, direct, not preachy.
Reading level: 8th–9th grade.
Belief framing: Say “Hindus believe…” not “this is the truth.”
Lesson length: 4–5 minutes each.
Each level should have 3–5 blocks.
No two consecutive levels should open with the same block type.
Use Acharya as the friendly guide character after Level 4.
Acharya means “teacher who teaches by example.”

SUPABASE CONTEXT:
The active Supabase project is:
Project name: Om Daily
Project ID/ref: uteervxxzmmhbzymouin
Region: us-west-2

Existing useful tables:
1. profiles
- id uuid, references auth.users.id
- current_lotus_level integer default 1
- streak_count integer
- longest_streak integer
- onboarding_complete boolean
- preferred_language text
- updated_at timestamptz


3. dharma_coin_balances
- user_id uuid primary key, references auth.users.id
- total_coins integer
- updated_at timestamptz

4. dharma_coin_transactions
- id uuid primary key
- user_id uuid
- source text, currently supports values including:
  streak, prayer, lotus_level, redemption, bonus, world_level, wisdom_gate
- source_ref text
- base_amount integer
- multiplier numeric
- amount integer
- streak_at_award integer
- earned_at_date date
- created_at timestamptz

Recommended implementation:
Create a new lotus path database in supabase without removing the old one and make this one contain S
Store each level in lotus_levels.
- Put the complete level content in questions jsonb, including blocks, quizzes, rewards, unlock info, and metadata.
- Use profiles.current_lotus_level to track unlocked level.
- Award coins through dharma_coin_transactions with source = 'lotus_level' or source = 'wisdom_gate'.
- Update dharma_coin_balances after successful completion.

COIN RULES:
Normal level first completion: +3 coins
Normal level replay: +0 coins 
Any level skip: -10 coins (there is no skip for wisdom gate)
Wisdom Gate first pass: +25 coins
Wisdom Gate replay pass: +5 coins
Wisdom Gate fail: +0 coins
Wisdom Gate passing score: 8/10, meaning 80%

PROGRESS RULES:
- User starts at Lotus Level 1.
- Completing a normal level unlocks the next level.
- Completing Level 20 unlocks Wisdom Gate.
- Passing Wisdom Gate unlocks Region 2: Mountain Path.
- If the user fails Wisdom Gate, show review message and allow retry.
- No penalty on fail.

REGION 1 FINAL STRUCTURE:
Use 20 levels + 1 Wisdom Gate.

Important reconstruction decisions:
- Do NOT include a full Puruṣārthas level in Region 1. Move Dharma, Artha, Kāma, Mokṣa to a later Dharma/Karma/Moksha region.
- Do NOT include a full “branches of Hinduism” level in Region 1. Move Vaiṣṇavism, Śaivism, Śāktism, and Smārtism to the gods/traditions region.
- Keep “One Truth, Many Paths” as a simple beginner idea, but do not require memorizing Bhakti, Jñāna, Karma, and Rāja yoga yet.
- Keep “Divine in Many Forms” as a teaser only.
- Keep family/culture content only if tied directly to Hindu values like respect, seva, elders, and home practice.
- Keep food/vegetarianism as myth-busting, not a deep philosophy lesson.

SUPPORTED BLOCK TYPES:
fact_card
paragraph
multiple_choice
true_false_swipe
story_panels
dialogue
tap_reveal
fill_blank
matching_cards
drag_to_order
build_sentence
odd_one_out
word_sort
tap_correct_image
interactive_diagram
timeline
dos_donts
mini_story

Now create the full raw curriculum seed data for Region 1 using this exact structure:

{
  "region": {
    "world": "hinduism",
    "region_number": 1,
    "region_slug": "lotus_path",
    "title": "Welcome to Hinduism",
    "subtitle": "The beginner’s path into Sanātana Dharma",
    "purpose": "Teach absolute beginners what Hinduism is, where it came from, why it has no single founder, why it is called Sanātana Dharma, and why it is called a way of life.",
    "unlock_next_region": "mountain_path"
  },
  "levels": [],
  "wisdom_gate": {}
}

CURRICULUM DATA:

LEVEL 1
slug: what_is_hinduism
title: What Is Hinduism?
primary_block: fact_card
goal: Hook the user and explain that Hinduism is not one single rulebook, but a family of beliefs and practices.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. fact_card
title: Welcome 🪷
fact: Hinduism is the world’s oldest living religion. Over 1.2 billion people follow it today.
subtext: By the end of this path, you’ll understand the basics of what Hinduism is.
2. paragraph
text: Hinduism is not just one thing. It is a huge family of beliefs, stories, rituals, values, and ways of life that grew in India over thousands of years. Some Hindus go to temple often. Some pray quietly at home. Some focus on devotion, some on philosophy, and some mostly live through family traditions. All of them can still be Hindu.
3. multiple_choice
question: About how many people in the world are Hindu today?
options: ["100 million", "500 million", "Over 1.2 billion", "3 billion"]
correct_index: 2
explanation: Hinduism has over 1.2 billion followers, making it one of the world’s largest religions.
4. true_false_swipe
statement: All Hindus believe and practice the exact same things.
answer: false
explanation: Hinduism includes many traditions, practices, and ways of worship.

LEVEL 2
slug: sanatana_dharma
title: The Real Name — Sanātana Dharma
primary_block: story_panels
goal: Teach that Hinduism’s traditional name is Sanātana Dharma.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. story_panels
panels:
- image: scroll_ancient.png, caption: Long before the word “Hinduism” existed…
- image: rishis_meditating.png, caption: Sages in India called their way of life Sanātana Dharma.
- image: sun_eternal.png, caption: Sanātana means eternal.
- image: compass.png, caption: Dharma means the right way to live, duty, order, and truth.
- image: lotus_blooming.png, caption: Together, Sanātana Dharma means “The Eternal Way.”



NOTE FIND THE IMAGES ON GOOGLE AND STORE THEM ON THE SUPABASE TOO
2. tap_reveal
cards:
- front: Sanātana, back: Eternal. Without beginning or end.
- front: Dharma, back: The right way to live. Duty, truth, and order.
- front: Sanātana Dharma, back: The Eternal Way, a traditional name for Hinduism.
3. fill_blank
sentence: The traditional name for Hinduism is ______ Dharma.
answer: Sanatana
accepted: ["Sanatana", "Sanātana", "sanatana"]
4. multiple_choice
question: What does Dharma mean in this beginner lesson?
options: ["A specific god", "The right way to live", "A temple building", "An ancient weapon"]
correct_index: 1
explanation: Dharma can mean duty, truth, order, and the right way to live. Later paths will go deeper.

LEVEL 3
slug: origin_of_word_hindu
title: Where Did the Word “Hindu” Come From?
primary_block: timeline
goal: Explain that “Hindu” began as a geographic/cultural word connected to the Sindhu River.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. timeline
title: The journey of one word
events:
- year: Ancient times, label: The Sindhu River flowed through northwest India.
- year: Later, label: Persian speakers used a sound closer to “Hindu” for people near/across the Sindhu.
- year: Later, label: Greeks used forms like “Indos/Indus,” which helped lead to the word India.
- year: Modern period, label: Hinduism became a broad word for the religious traditions of Hindus.
2. fact_card
title: The word started with a river
fact: “Hindu” was originally connected to geography and people near the Sindhu River.
subtext: It became a religious identity over time.
3. drag_to_order
instruction: Put these in the correct order.
items:
- The Sindhu River was known in ancient India.
- Nearby peoples used words like Hindu/Indus.
- The land became known as India.
- Hinduism became a broad religious label.
correct_order: [0,1,2,3]
4. true_false_swipe
statement: The word “Hindu” originally began as only a religious label.
answer: false
explanation: It began more as a geographic/cultural label and became religious over time.

LEVEL 4
slug: oldest_living_religion
title: The Oldest Living Religion
primary_block: dialogue
goal: Introduce Acharya and explain that Hinduism is ancient and still practiced today.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. dialogue
character: Acharya
character_subtitle: Acharya means “teacher who teaches by example.”
messages:
- from: acharya, text: Hey 👋 I’m Acharya. I’ll guide you through this journey.
- from: acharya, text: Quick question. How old do you think Hinduism is?
- from: user_choice, options: ["A few hundred years", "About 1,000 years", "Over 4,000 years"]
- from: acharya, text: Over 4,000 years. Hinduism is ancient — and it is still alive today.
2. paragraph
text: Hinduism’s roots go back thousands of years. Its oldest sacred texts, the Vedas, were composed long ago and passed down through generations. Many ancient traditions disappeared, but Hinduism continued to grow and adapt. That is why people often call it the world’s oldest living religion.
3. matching_cards
instruction: Match the tradition with its rough age.
pairs:
- term: Hinduism, match: 4,000+ years
- term: Christianity, match: About 2,000 years
- term: Islam, match: About 1,400 years
4. multiple_choice
question: Why is Hinduism called the oldest “living” religion?
options: ["Because Hindus live the longest", "Because it is ancient and still practiced today", "Because it was recently discovered", "Because it only exists in books"]
correct_index: 1
explanation: Hinduism is ancient and still practiced by over a billion people.

LEVEL 5
slug: no_single_founder
title: Hinduism Has No Single Founder
primary_block: concept_map
goal: Show that Hinduism grew from many sages, texts, communities, and traditions over time.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. concept_map
title: Most religions have a founder. Hinduism is different.
nodes:
- label: Christianity, children: ["Jesus"]
- label: Islam, children: ["Prophet Muhammad"]
- label: Buddhism, children: ["The Buddha"]
- label: Sikhism, children: ["Guru Nanak"]
- label: Hinduism, children: ["No single founder — many sages and traditions over thousands of years"], highlight: true
2. tap_reveal
cards:
- front: Rishi, back: A sage or seer who discovered deep spiritual truths.
- front: Paramparā, back: A chain of teaching passed from teacher to student.
- front: Guru, back: A teacher who guides spiritual learning.
3. build_sentence
instruction: Tap the words in order.
tiles: ["Hinduism", "has", "no", "single", "founder"]
correct: ["Hinduism", "has", "no", "single", "founder"]
4. odd_one_out
instruction: Three of these have one famous founder. One does not.
options: ["Christianity", "Islam", "Buddhism", "Hinduism"]
correct_index: 3
explanation: Hinduism has no single founder.

LEVEL 6
slug: birthplace_bharat
title: The Birthplace — Bhārat
primary_block: mini_story
goal: Teach that Hinduism began in ancient India, also called Bhārat.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. mini_story
title: Where did it begin?
story: Anaya asked her grandfather, “Where did Hinduism start?” He pointed to a map of India and said, “Here — in a land of rivers, forests, mountains, sages, and stories. Today many call it India, but its ancient name is Bhārat.”
takeaway: Hinduism began in ancient India, also called Bhārat.
2. fact_card
title: Two names, one land
fact: Bhārat is a traditional name for India.
subtext: Many Hindus use Bhārat to speak about the land where Hindu traditions began.
3. multiple_choice
question: Where did Hinduism begin?
options: ["Ancient Egypt", "Ancient Greece", "Ancient India/Bhārat", "Ancient China"]
correct_index: 2
explanation: Hinduism began in ancient India, also called Bhārat.
4. fill_blank
sentence: The traditional name Bhārat refers to ______.
answer: India
accepted: ["India", "india", "Bharat", "Bhārat"]

LEVEL 7
slug: sacred_rivers
title: A Sacred Land of Rivers
primary_block: interactive_diagram
goal: Show that Hindu civilization grew around rivers and that rivers became sacred.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. interactive_diagram
image: map_india_rivers.png
caption: Tap each river to learn about it.
hotspots:
- label: Sindhu/Indus, info: The river connected to the words Hindu and India.
- label: Gaṅgā/Ganges, info: The most sacred river in Hinduism.
- label: Yamunā, info: A sacred river linked with Krishna traditions.
- label: Sarasvatī, info: A sacred river remembered in Hindu tradition.
2. paragraph
text: Civilizations often grow near rivers. Hindu civilization did too. Rivers like the Sindhu, Gaṅgā, and Yamunā were not only sources of water. Over time, Hindus saw them as sacred, life-giving, and connected to the divine.
3. tap_correct_image
question: Which river is considered the most sacred in Hinduism?
options:
- label: Amazon, image: amazon.png
- label: Nile, image: nile.png
- label: Gaṅgā/Ganges, image: ganga.png
- label: Mississippi, image: mississippi.png
correct_index: 2
explanation: The Gaṅgā is considered the holiest river in Hinduism.
4. true_false_swipe
statement: In Hinduism, some rivers are treated as sacred.
answer: true
explanation: Many Hindus treat rivers like the Gaṅgā as sacred and life-giving.

LEVEL 8
slug: one_truth_many_paths
title: One Truth, Many Paths
primary_block: paragraph
goal: Introduce the beginner idea that Hinduism accepts many paths to the divine.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. paragraph
text: One of Hinduism’s biggest beginner ideas is this: there can be one ultimate truth, but many ways to approach it. Some Hindus worship God with form. Some think of the divine as formless. Some focus on devotion, some on meditation, some on wisdom, and some on service.
2. fact_card
title: Many paths are allowed
fact: Hinduism is comfortable with many ways of worship and spiritual practice.
subtext: Later regions will explain these paths more deeply.
3. build_sentence
instruction: Build the idea.
tiles: ["Truth", "is", "one,", "the", "wise", "call", "it", "by", "many", "names."]
correct: ["Truth", "is", "one,", "the", "wise", "call", "it", "by", "many", "names."]
footer: Inspired by Rigveda 1.164.46
4. multiple_choice
question: What does “one truth, many paths” mean in this lesson?
options: ["Only one practice is allowed", "Hinduism accepts many ways to approach the divine", "Nobody can worship", "All religions are exactly the same"]
correct_index: 1
explanation: Hinduism allows many forms of worship and spiritual practice.

LEVEL 9
slug: way_of_life
title: Hinduism Is a Way of Life
primary_block: dialogue
goal: Explain that Hinduism is woven into daily life, not only temple worship.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. dialogue
character: Acharya
messages:
- from: acharya, text: When people hear “religion,” they often think of one building or one weekly service.
- from: acharya, text: Hinduism is broader than that.
- from: acharya, text: It can show up in food, family, festivals, prayers, music, art, values, and how people greet each other.
- from: acharya, text: That is why many Hindus call it a way of life.
2. fact_card
title: It shows up everywhere
fact: Hinduism can shape daily habits, family life, food, worship, festivals, music, and values.
subtext: Temple worship is important, but it is only one part.
3. true_false_swipe
statement: Hinduism only happens inside temples.
answer: false
explanation: Hinduism is often woven into daily life.
4. multiple_choice
question: Which can be part of Hindu daily life?
options: ["Lighting a lamp", "Greeting elders respectfully", "Eating festival foods", "All of these"]
correct_index: 3
explanation: Hinduism often shows up through everyday actions.

LEVEL 10
slug: divine_many_forms
title: The Divine in Many Forms
primary_block: story_panels
goal: Give a simple teaser for why Hindus use many names and forms for the divine.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. story_panels
panels:
- image: person_smiling.png, caption: Meet Priya.
- image: priya_with_child.png, caption: To her child, she is Mom.
- image: priya_at_work.png, caption: At work, she is Doctor.
- image: priya_with_friend.png, caption: To her friend, she is Priya.
- image: one_person_many_roles.png, caption: One person can be known in many ways.
- image: divine_forms.png, caption: Some Hindus understand the divine like that: one ultimate reality, many forms.
2. tap_reveal
cards:
- front: Īśvara, back: A common word for God or the Lord.
- front: Devatā, back: A divine being, god, or goddess.
- front: Bhagavān, back: A respectful word for the Divine One.
3. word_sort
instruction: Sort these terms.
categories: ["Names/terms for the divine", "Not names for the divine"]
items:
- word: Īśvara, category: 0
- word: Devatā, category: 0
- word: Bhagavān, category: 0
- word: Sindhu, category: 1
- word: Bhārat, category: 1
4. multiple_choice
question: Why do Hindus use many names and images for God?
options: ["Because Hinduism accepts many forms of the divine", "Because Hindus cannot decide", "Because every Hindu ignores all other forms", "Because images are random"]
correct_index: 0
explanation: Many Hindus believe one ultimate reality can be approached through many forms. A later region will go deeper.

LEVEL 11
slug: ahimsa
title: Ahiṁsā — All Life Is Sacred
primary_block: mini_story
goal: Introduce ahiṁsā as non-harm toward living beings.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. mini_story
title: The ant on the floor
story: Rohan was about to step on a line of ants when his grandmother stopped him. “Every life matters,” she said. “Big or small, we try not to harm it.” Rohan stepped around the ants instead.
takeaway: Ahiṁsā means non-harm.
2. paragraph
text: Ahiṁsā means non-harm or non-violence. In Hindu thought, life is sacred. This value can shape how people eat, speak, act, and treat animals, people, and nature.
3. fill_blank
sentence: ______ means non-harm or non-violence.
answer: Ahimsa
accepted: ["Ahimsa", "Ahiṁsā", "ahimsa"]
4. matching_cards
instruction: Match the action.
pairs:
- term: Stepping around a bug, match: Aligns with ahiṁsā
- term: Speaking kindly when angry, match: Aligns with ahiṁsā
- term: Bullying someone, match: Goes against ahiṁsā
- term: Hurting animals for fun, match: Goes against ahiṁsā

LEVEL 12
slug: respect_for_nature
title: Respect for Nature
primary_block: dos_donts
goal: Combine nature, rivers, animals, and earth respect without going too deep.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. dos_donts
title: Hinduism and Nature
dos:
- icon: 🌊, text: Rivers like the Gaṅgā are treated as sacred.
- icon: 🌳, text: Some trees, like Peepal and Banyan, are honored.
- icon: 🐄, text: Cows are treated with deep respect.
- icon: 🏔️, text: Mountains like the Himalayas are connected with sacred stories.
donts:
- icon: 🚯, text: Polluting sacred rivers is seen as deeply wrong.
- icon: 🪓, text: Destroying nature without need goes against respect for life.
2. paragraph
text: In Hinduism, nature is not seen as dead or empty. Rivers, trees, animals, mountains, and the earth can all be treated with reverence. This connects back to ahiṁsā: respecting life means respecting the world that supports life.
3. true_false_swipe
statement: In Hindu tradition, nature can be part of spiritual life.
answer: true
explanation: Many Hindu practices honor rivers, trees, animals, and the earth.
4. odd_one_out
instruction: Three are commonly sacred in Hinduism. One is not.
options: ["Gaṅgā river", "Peepal tree", "Cow", "Plastic chair"]
correct_index: 3
explanation: The first three are commonly treated with reverence. A plastic chair is just an object.

LEVEL 13
slug: elders_teachers_parents
title: Respect for Elders, Teachers, and Parents
primary_block: dialogue
goal: Teach respect culture through praṇām, namaste, guru, parents, and elders.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. dialogue
character: Acharya
messages:
- from: acharya, text: In many Hindu families, respect is shown through small actions.
- from: acharya, text: You may greet elders with folded hands, bow, or touch their feet.
- from: acharya, text: These actions say: I honor your wisdom and the divine within you.
2. tap_reveal
cards:
- front: Praṇām, back: A respectful bow, sometimes touching an elder’s feet.
- front: Namaste, back: A respectful greeting with folded hands. Many understand it as honoring the divine in another person.
- front: Guru, back: A teacher or guide.
3. build_sentence
instruction: Build the meaning often connected to Namaste.
tiles: ["I", "bow", "to", "the", "divine", "in", "you"]
correct: ["I", "bow", "to", "the", "divine", "in", "you"]
4. multiple_choice
question: What is praṇām?
options: ["A type of food", "A respectful bow or greeting", "A river", "A festival"]
correct_index: 1
explanation: Praṇām is a respectful bow or greeting, often toward elders or teachers.

LEVEL 14
slug: family_home_practice
title: Family and Home Practice
primary_block: mini_story
goal: Keep family content, but tie it directly to Hindu home life, respect, seva, and rituals.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. mini_story
title: The small lamp
story: Every evening, Meera watched her grandmother light a small lamp near the home shrine. Then the family gathered for a short prayer before dinner. It was not a huge ceremony. It was simple. But it reminded everyone to pause, feel grateful, and stay connected.
takeaway: For many Hindus, spiritual life begins at home.
2. fact_card
title: Home matters
fact: Many Hindu families practice daily worship at home, not only in temples.
subtext: A small shrine, lamp, prayer, or family tradition can become part of spiritual life.
3. matching_cards
instruction: Match the word to the meaning.
pairs:
- term: Mātā, match: Mother
- term: Pitā, match: Father
- term: Guru, match: Teacher
- term: Seva, match: Selfless service
4. fill_blank
sentence: Many Hindus first learn values and prayer at ______.
answer: home
accepted: ["home", "Home"]

LEVEL 15
slug: food_and_vegetarianism
title: Food and Vegetarianism
primary_block: paragraph
goal: Correct the myth that all Hindus are vegetarian while explaining ahiṁsā and cow respect.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. paragraph
text: Not every Hindu is vegetarian. Some are strict vegetarians. Some avoid beef but eat other foods. Some follow different customs based on region, family, or tradition. The deeper idea is that food should be eaten with gratitude, purity, and respect for life.
2. dos_donts
title: Common Hindu food traditions
dos:
- icon: 🌱, text: Many Hindus choose vegetarian food.
- icon: 🙏, text: Food may be offered to the divine before eating. This blessed food is called prasāda.
- icon: 🥛, text: Dairy is often used in Hindu worship and food traditions.
donts:
- icon: 🐄, text: Most Hindus avoid beef out of respect for the cow.
- icon: 🍷, text: Many religious Hindus avoid alcohol and intoxicants.
3. multiple_choice
question: Which statement is most accurate?
options: ["All Hindus are strict vegetarians", "No Hindus are vegetarian", "Many Hindus are vegetarian, and most avoid beef", "Hindus only eat fruit"]
correct_index: 2
explanation: Hindu food customs vary, but many Hindus are vegetarian and most avoid beef.
4. word_sort
instruction: Sort these based on common Hindu vegetarian families.
categories: ["Usually accepted", "Usually avoided"]
items:
- word: Rice, category: 0
- word: Lentils, category: 0
- word: Fruits, category: 0
- word: Milk, category: 0
- word: Beef, category: 1
- word: Alcohol, category: 1

LEVEL 16
slug: sacred_places_pilgrimage
title: Sacred Places and Pilgrimage
primary_block: interactive_diagram
goal: Introduce the idea of sacred places and pilgrimage.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. interactive_diagram
image: map_holy_cities.png
caption: Tap each place to learn why it matters.
hotspots:
- label: Varanasi/Kāśī, info: One of Hinduism’s most sacred cities, located on the Gaṅgā.
- label: Haridwar, info: A major pilgrimage place where the Gaṅgā enters the plains.
- label: Prayāgrāj, info: A sacred meeting place of rivers and home to Kumbh Mela.
- label: Dwārkā, info: A sacred city connected with Krishna.
- label: Rāmeśvaram, info: A sacred southern site connected with the Rāmāyaṇa.
2. fact_card
title: The journey is part of the prayer
fact: A pilgrimage is a journey to a sacred place.
subtext: In Hinduism, the travel itself can become part of worship.
3. tap_correct_image
question: Which image best shows Varanasi?
options:
- label: Skyscrapers, image: skyscrapers.png
- label: Stone steps by a sacred river, image: varanasi_ghats.png
- label: Desert, image: desert.png
- label: Snowy forest, image: snowy_forest.png
correct_index: 1
explanation: Varanasi is famous for ghats, or stone steps, along the Gaṅgā.
4. true_false_swipe
statement: Pilgrimage is an important Hindu practice.
answer: true
explanation: Many Hindus travel to sacred rivers, temples, and cities as part of devotion.

LEVEL 17
slug: festivals_first_look
title: A First Look at Festivals
primary_block: fact_card
goal: Introduce festivals lightly without stealing from the later festival region.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. fact_card
title: Hinduism is full of festivals
fact: Hindu festivals remember stories, seasons, gods, values, family, light, devotion, and victory of good over evil.
subtext: You will explore festivals deeply in a later path.
2. paragraph
text: Festivals are one reason Hinduism feels alive. People may light lamps, decorate homes, visit temples, cook special foods, sing, fast, give gifts, or gather with family. Festivals make big spiritual ideas easier to feel and remember.
3. matching_cards
instruction: Match the festival to the beginner idea.
pairs:
- term: Diwali, match: Light and the victory of good
- term: Holi, match: Color, joy, and renewal
- term: Navaratri, match: Devotion to the Divine Mother
- term: Janmashtami, match: Birth of Krishna
4. multiple_choice
question: Why are festivals important in Hinduism?
options: ["They make spiritual stories and values part of life", "They replace all prayer", "They are only for children", "They have no meaning"]
correct_index: 0
explanation: Festivals help people live, remember, and celebrate spiritual ideas.

LEVEL 18
slug: hinduism_global_today
title: Hinduism Around the World Today
primary_block: timeline
goal: Show that Hinduism is ancient but also global and alive today.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. timeline
title: Hinduism’s journey across the world
events:
- year: Ancient/medieval period, label: Hindu ideas, temples, and stories spread through parts of Southeast Asia.
- year: 1800s, label: Indian communities carried Hindu traditions to places like the Caribbean, Africa, and Fiji.
- year: 1900s, label: Hindu teachers, yoga, and meditation became more known in the West.
- year: Today, label: Hindu communities live across the United States, Canada, UK, Australia, Asia, Africa, and the Caribbean.
2. dialogue
character: Acharya
messages:
- from: acharya, text: Hinduism began in India, but it did not stay only there.
- from: acharya, text: Today, Hindus live all over the world.
- from: acharya, text: Temples, festivals, and home traditions exist in many countries.
3. drag_to_order
instruction: Put these in order.
items:
- Hindu traditions grow in India/Bhārat.
- Hindu influence spreads into parts of Southeast Asia.
- Indian communities carry Hinduism around the world.
- Hindu communities thrive globally today.
correct_order: [0,1,2,3]
4. fill_blank
sentence: Hinduism began in India/Bhārat, but today it is practiced around the ______.
answer: world
accepted: ["world", "World"]

LEVEL 19
slug: beginner_recap
title: What You Know Now
primary_block: concept_map
goal: Recap the most important beginner ideas before the final level.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. concept_map
title: Hinduism in one map
nodes:
- label: Hinduism, highlight: true, children:
  - Sanātana Dharma
  - No single founder
  - Began in India/Bhārat
  - One truth, many paths
  - A way of life
  - Ahiṁsā and respect for life
  - Sacred nature and rivers
2. matching_cards
instruction: Match each beginner term.
pairs:
- term: Sanātana Dharma, match: The Eternal Way
- term: Bhārat, match: India
- term: Ahiṁsā, match: Non-harm
- term: Gaṅgā, match: Sacred river
3. true_false_swipe
statement: Hinduism is only one rulebook followed exactly the same way by everyone.
answer: false
explanation: Hinduism is a family of traditions, values, stories, and practices.
4. multiple_choice
question: Which idea best describes Region 1?
options: ["Hinduism is simple and has one founder", "Hinduism is an ancient, living way of life with many paths", "Hinduism only happens in temples", "Hinduism began in Europe"]
correct_index: 1
explanation: That is the clean beginner summary.

LEVEL 20
slug: journey_ahead
title: Your Journey Ahead
primary_block: story_panels
goal: Celebrate completion and tease Region 2.
difficulty_tier: beginner
reward_coins: 3
blocks:
1. story_panels
panels:
- image: user_at_start.png, caption: When you started, Hinduism may have felt like a question mark.
- image: lotus_path_begin.png, caption: You learned its traditional name: Sanātana Dharma.
- image: ancient_river.png, caption: You learned where the words Hindu, India, and Bhārat connect.
- image: many_paths_one_truth.png, caption: You learned the idea of one truth, many paths.
- image: ahimsa_lotus.png, caption: You learned ahiṁsā and respect for life.
- image: mountain_ahead.png, caption: The Lotus Path is ending. The Mountain Path waits ahead.
2. fact_card
title: You completed the Lotus Path 🏆
fact: You now understand the beginner foundation of Hinduism.
subtext: One Wisdom Gate stands between you and Region 2.
3. paragraph
text: Next, the Mountain Path will explore the deeper ideas: Brahman, Ātman, the soul, and the divine self. Later paths will cover karma, dharma, moksha, gods and goddesses, scriptures, worship, festivals, and daily Hindu life.
4. multiple_choice
question: What comes after the Lotus Path?
options: ["Mountain Path", "Ocean Path", "Desert Path", "Sky Path"]
correct_index: 0
explanation: Region 2 is the Mountain Path.
5. true_false_swipe
statement: The Wisdom Gate is the final check before unlocking the next region.
answer: true
explanation: Pass the Wisdom Gate to unlock Region 2.

WISDOM GATE:
slug: lotus_path_wisdom_gate
title: Wisdom Gate — Lotus Path
format: 10 questions
passing_score: 8
reward_first_pass: 25
reward_replay_pass: 5
fail_penalty: 0
unlock_on_pass: mountain_path

questions:
1. multiple_choice
question: What is the traditional Sanskrit name for Hinduism?
options: ["Sindhu Dharma", "Sanātana Dharma", "Bhārat Dharma", "Vedic Dharma"]
correct_index: 1
explanation: Sanātana Dharma means The Eternal Way.

2. fill_blank
sentence: The Hindu value of non-harm toward living beings is called ______.
answer: Ahimsa
accepted: ["Ahimsa", "Ahiṁsā", "ahimsa"]
explanation: Ahiṁsā means non-harm or non-violence.

3. true_false_swipe
statement: Hinduism has one single founder.
answer: false
explanation: Hinduism has no single founder. It grew from many sages and traditions over thousands of years.

4. matching_cards
instruction: Match each term to its meaning.
pairs:
- term: Sanātana, match: Eternal
- term: Dharma, match: The right way to live
- term: Ahiṁsā, match: Non-harm
- term: Bhārat, match: India

5. drag_to_order
instruction: Put these in historical order.
items:
- Hindu traditions grow in ancient India/Bhārat.
- The Sindhu/Indus region helps shape words like Hindu and India.
- Hinduism continues for thousands of years.
- Hindu communities exist around the world today.
correct_order: [0,1,2,3]

6. word_sort
instruction: Sort these into the right group.
categories: ["Sacred or important in Hinduism", "Not specifically sacred"]
items:
- word: Gaṅgā river, category: 0
- word: Peepal tree, category: 0
- word: Cow, category: 0
- word: Random plastic chair, category: 1
- word: Regular pencil, category: 1

7. odd_one_out
instruction: Three of these belong clearly in the beginner foundation. One is too advanced for Region 1.
options: ["Sanātana Dharma", "Ahiṁsā", "No single founder", "Detailed branches like Vaiṣṇavism and Śaivism"]
correct_index: 3
explanation: The branches are important but belong in a later gods/traditions region.

8. build_sentence
instruction: Build this central Hindu idea.
tiles: ["Truth", "is", "one,", "the", "wise", "call", "it", "by", "many", "names."]
correct: ["Truth", "is", "one,", "the", "wise", "call", "it", "by", "many", "names."]
explanation: This expresses the beginner idea that Hinduism accepts many paths to the divine.

9. multiple_choice
question: Why do Hindus use many names and forms for the divine?
options:
- Because many Hindus believe one ultimate reality can be approached in many forms
- Because Hinduism has no spiritual ideas
- Because every Hindu must ignore all other forms
- Because images are random decorations
correct_index: 0
explanation: Many Hindus understand the divine through many names, images, and forms.

10. fill_blank
sentence: Hinduism began in ancient India, also called ______.
answer: Bharat
accepted: ["Bharat", "Bhārat", "India", "india"]
explanation: Bhārat is a traditional name for India.

PASS MESSAGE:
You’ve completed the Lotus Path. The Mountain Path now opens before you.

FAIL MESSAGE:
You’re close. Review the Lotus Path and try the Wisdom Gate again. No coins lost.

DATABASE/SEED REQUIREMENTS:
Generate clean Supabase seed data for the 20 levels and Wisdom Gate.
Use JSONB for blocks and questions.
Keep all slugs stable.
Avoid duplicate level IDs.
Use id 1–20 for normal levels.
Use id 21 for Wisdom Gate if storing it inside lotus_levels, or use a separate wisdom_gate object if using a better schema.
Make sure every question has:
- type
- prompt/question/sentence/instruction
- options/items/pairs if needed
- correct_index, answer, accepted, correct_order, or correct depending on type
- explanation

If creating SQL:
- Use INSERT ... ON CONFLICT (id) DO UPDATE so rerunning the seed is safe.
- Do not delete user progress.
- Do not expose Supabase secret keys.
- Do not hardcode user IDs.
- Do not break existing profiles.current_lotus_level behavior.
- Respect RLS.
- User progress writes should only affect the authenticated user.

OUTPUT FORMAT:
Return:
1. Final optimized curriculum JSON
2. Supabase SQL seed/migration if needed
3. TypeScript types/interfaces for the curriculum objects
4. Completion/checking logic pseudocode
5. A short test checklist

TEST CHECKLIST:
- Level 1 loads correctly.
- Each level has 3–5 blocks.
- No two consecutive levels open with the same primary block type.
- Each level has at least one interaction or question.
- Completing a level awards +3 coins only once.
- Completing a level unlocks the next level.
- Completing Level 20 unlocks Wisdom Gate.
- Wisdom Gate has exactly 10 questions.
- Wisdom Gate requires 8/10 to pass.
- Wisdom Gate first pass awards +25 coins.
- Wisdom Gate replay pass awards +5 coins.
- Wisdom Gate fail awards +0 coins.
- Passing Wisdom Gate unlocks Mountain Path.
- Existing user progress is not deleted.
- Supabase RLS is not bypassed incorrectly.
- All Sanskrit terms support common non-diacritic spellings in fill_blank accepted answers.