// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

const INDIAN_HOLIDAYS_2026 = [
    {
        date: "2026-01-14",
        name: "Makar Sankranti",
        hindi: "मकर संक्रांति",
        description: "Makar Sankranti marks the sun's transition into Capricorn (Makar) and the beginning of longer days. It is one of the few Hindu festivals based on the solar calendar. People fly kites, take holy dips in rivers like the Ganges, and prepare sweets made from sesame and jaggery (til-gur). It symbolizes the end of winter and new beginnings.",
        color: "from-orange-500 to-yellow-500"
    },
    {
        date: "2026-01-26",
        name: "Republic Day",
        hindi: "गणतंत्र दिवस",
        description: "Republic Day commemorates the adoption of the Constitution of India on January 26, 1950, when India became a fully sovereign republic. The day features a grand parade in New Delhi showcasing India's military strength, cultural diversity, and achievements. It honors the values of justice, liberty, equality, and fraternity enshrined in the Constitution.",
        color: "from-orange-500 to-green-500"
    },
    {
        date: "2026-02-26",
        name: "Maha Shivaratri",
        hindi: "महा शिवरात्रि",
        description: "Maha Shivaratri, the 'Great Night of Shiva,' is dedicated to Lord Shiva. Devotees observe fasting, night-long vigils, and offer bilva leaves, milk, and water to Shiva Lingams. The festival celebrates the cosmic dance of creation and destruction. It is believed that on this night, Shiva performed the Tandava, and sincere worship grants liberation (moksha).",
        color: "from-blue-600 to-indigo-600"
    },
    {
        date: "2026-03-03",
        name: "🎨 Holi — Festival of Colors",
        hindi: "होली",
        description: `What is it: Holi is a spring festival that celebrates happiness, friendship, and a "fresh start." Most people celebrate it for two days: the bonfire night (Holika Dahan) and then the color day (Rangwali Holi).

Origin: A famous story behind Holi is about Prahlad, a good person who kept faith, and Holika, who tried to harm him using fire. The story ends with good winning over evil, which is why the bonfire is important.

How to celebrate: People gather for a bonfire at night, then the next day they play with colored powder and water, eat sweets, and visit friends/family. Some families also do a short prayer before starting the colors.

Dos: Use skin-safe colors, ask before putting color on someone, and protect eyes.
Don'ts: Force anyone, throw dirty water, or use harmful chemicals. Don't treat it as an excuse to act rude — Holi is supposed to be joyful and respectful.`,
        color: "from-pink-500 to-purple-500"
    },
    {
        date: "2026-03-19",
        name: "🌿 Gudi Padwa / Ugadi — Hindu New Year",
        hindi: "गुड़ी पड़वा / उगादि",
        description: `What is it: This is New Year for many Hindu communities (like Marathi and Telugu/Kannada traditions). It celebrates the start of a new year on the Hindu lunar calendar.

Origin: It's tied to ancient Indian calendar systems and seasonal change. Many people connect it to "starting fresh" and welcoming spring.

How to celebrate: Families clean the home, wear new clothes, do a short prayer, and eat a festive meal. In Maharashtra, people raise a Gudi (a decorated flag-like symbol) outside the home.

Dos: Keep it positive — new year energy, gratitude, family time.
Don'ts: Turn it into only superstition; focus on good habits and a fresh mindset too.`,
        color: "from-yellow-500 to-orange-500"
    },
    {
        date: "2026-03-26",
        name: "🏹 Rama Navami",
        hindi: "राम नवमी",
        description: `What is it: Rama Navami celebrates the birth of Lord Rama, known for honesty, duty, and self-control. It's a day many Hindus use to think about "doing the right thing even when it's hard."

Origin: It comes from the Ramayana, the story of Rama's life. Rama is seen as an example of how to live with values.

How to celebrate: People read or listen to the Ramayana, go to temple, sing bhajans, and some people fast. Many families keep it simple: prayer + a meal + a story.

Dos: Focus on Rama's values (truth, courage, responsibility).
Don'ts: Use the festival to judge others — this day is about improving yourself.`,
        color: "from-amber-500 to-orange-500"
    },
    {
        date: "2026-03-31",
        name: "🕊️ Mahavir Jayanti (Jain)",
        hindi: "महावीर जयंती",
        description: `What is it: This celebrates the birth of Lord Mahavira, the 24th Tirthankara in Jainism. It's one of the biggest Jain holidays.

Origin: It honors Mahavira's life and teachings, especially ahimsa (non-violence), truth, and self-control. In Jainism, the goal is to purify the soul by reducing harm and ego.

How to celebrate: Jains visit temples, listen to teachings, do prayers, and give to charity. Some communities do peaceful processions and community service.

Dos: Practice kindness in speech and actions, even online.
Don'ts: Treat "non-violence" as only physical — hurting with words counts too.`,
        color: "from-sky-500 to-blue-500"
    },
    {
        date: "2026-04-02",
        name: "🐒 Hanuman Jayanti",
        hindi: "हनुमान जयंती",
        description: `What is it: This honors Lord Hanuman, known for bravery, loyalty, and devotion. People look up to him as someone who uses strength for good, not ego.

Origin: Hanuman is a major figure in the Ramayana and represents serving others with courage and humility.

How to celebrate: People chant the Hanuman Chalisa, visit temples, and some fast. Many families keep it simple: prayer, reading a short story, and doing a good deed.

Dos: Use it as a "discipline day" (better habits, less laziness).
Don'ts: Flex strength or confidence in a toxic way — Hanuman is strong and humble.`,
        color: "from-orange-500 to-red-500"
    },
    {
        date: "2026-04-19",
        name: "🌟 Akshaya Tritiya",
        hindi: "अक्षय तृतीया",
        description: `What is it: This is considered a highly auspicious day for starting good things (learning, charity, new goals). "Akshaya" means something like "it doesn't run out" — people believe good actions done today have long-lasting results.

Origin: The idea comes from traditional Hindu belief that certain days are spiritually "strong" based on the lunar calendar. It became known as a day for charity and fresh beginnings.

How to celebrate: People donate, help others, pray, and some buy gold or start new work. A modern version: start a good habit and make a plan to keep it.

Dos: Focus on charity and meaningful beginnings, not just shopping.
Don'ts: Spend money you don't have just because it's "lucky."`,
        color: "from-yellow-400 to-amber-500"
    },
    {
        date: "2026-05-01",
        name: "🌕 Buddha Purnima",
        hindi: "बुद्ध पूर्णिमा",
        description: `What is it: This celebrates the Buddha and is observed by many Buddhists, and also recognized on Hindu calendars. It's a peaceful day focused on compassion and self-control.

Origin: It marks important moments connected to the Buddha's life in Buddhist tradition. Over time, it became a day for reflection and kindness.

How to celebrate: People visit temples, meditate, read teachings, and do charity. A simple way: do one act of kindness and avoid anger for the day.

Dos: Keep the day calm and respectful.
Don'ts: Turn it into arguments about religion — this day is about peace.`,
        color: "from-yellow-400 to-amber-500"
    },
    {
        date: "2026-05-25",
        name: "🌊 Ganga Dussehra",
        hindi: "गंगा दशहरा",
        description: `What is it: This day honors the river Ganga (Ganges) and her importance in Hindu tradition. Many see the Ganga as a symbol of cleansing and renewal.

Origin: It connects to stories of the Ganga "coming down to Earth," which is why it's sometimes linked to purification and blessings.

How to celebrate: People pray, do charity, and in India many take a river bath. Outside India, families often do a simple prayer and focus on "cleaning" habits (like quitting a bad habit).

Dos: Treat rivers and nature respectfully (no littering).
Don'ts: Think purity is only physical — actions and attitude matter too.`,
        color: "from-blue-400 to-cyan-500"
    },
    {
        date: "2026-07-07",
        name: "Rath Yatra",
        hindi: "रथ यात्रा",
        description: "Rath Yatra in Puri, Odisha, is one of the oldest and largest chariot festivals. Giant wooden chariots carrying deities Jagannath, Balabhadra, and Subhadra are pulled through streets by thousands of devotees. The English word 'juggernaut' comes from 'Jagannath.' The festival symbolizes equality, as people of all castes participate together.",
        color: "from-red-500 to-yellow-500"
    },
    {
        date: "2026-07-29",
        name: "👩‍🏫 Guru Purnima",
        hindi: "गुरु पूर्णिमा",
        description: `What is it: This is a day to honor teachers and mentors (guru = teacher). It can be religious (spiritual teachers) or personal (school teachers, parents, coaches).

Origin: It is tied to honoring great teachers in Indian tradition, including the idea that learning is sacred. It grew into a day where people show gratitude for guidance.

How to celebrate: Thank a teacher, write a message, donate to education, or study seriously that day. Some people do prayers or listen to spiritual talks.

Dos: Show real gratitude (not fake "Happy Guru Purnima" then ignore them).
Don'ts: Put teachers on a pedestal if they behave badly — respect should include wisdom.`,
        color: "from-amber-400 to-yellow-500"
    },
    {
        date: "2026-08-28",
        name: "🧵 Raksha Bandhan",
        hindi: "रक्षा बंधन",
        description: `What is it: This is a festival about the bond between siblings. A sister (or sibling) ties a rakhi (thread) as a symbol of love, and the brother (or sibling) promises support and protection.

Origin: There are multiple stories connected to Raksha Bandhan, but the main idea is simple: a thread that represents care and responsibility. Over time it became a yearly tradition to celebrate sibling relationships.

How to celebrate: Tie the rakhi, do a short prayer (optional), share sweets, and give a small gift or handwritten note. Many modern families include sisters-sisters and brothers-brothers too — same meaning: love and support.

Dos: Keep it respectful and meaningful (promise to actually show up for your sibling).
Don'ts: Make it only about gifts or money. Don't use "protection" as control — real support respects boundaries.`,
        color: "from-pink-500 to-red-500"
    },
    {
        date: "2026-09-03",
        name: "🦚 Krishna Janmashtami",
        hindi: "कृष्ण जन्माष्टमी",
        description: `What is it: This celebrates the birth of Lord Krishna, a major Hindu figure known for wisdom, love, and guidance (Bhagavad Gita). Many people fast or do prayers until midnight because Krishna's birth is traditionally remembered at night.

Origin: Krishna's story includes being born during a dangerous time and later helping restore fairness and dharma (doing what's right). The festival became a way to remember his life lessons.

How to celebrate: People sing bhajans, read a Krishna story, do midnight prayer, and eat prasad afterward. Some communities do Dahi Handi events (human pyramid to break a pot) as a fun tradition.

Dos: Learn one simple lesson Krishna teaches (like self-control or calmness).
Don'ts: Overdo fasting if it makes you sick. Don't let celebrations become unsafe (crowds/pyramids need safety rules).`,
        color: "from-blue-500 to-indigo-500"
    },
    {
        date: "2026-09-08",
        name: "🕯️ Paryushana (Jain)",
        hindi: "पर्युषण",
        description: `What is it: Paryushana is the most important Jain spiritual period (starts Sept 8), and Samvatsari (Sept 15) is the final big forgiveness day. It focuses on self-improvement, controlling anger/ego, and asking for forgiveness.

Origin: Jainism teaches that our actions and attitudes leave a "mark" on the soul, and this week is meant to clean that through discipline and reflection. Samvatsari became famous because forgiveness is treated as the highest strength.

How to celebrate: People fast (at their own level), attend temple, listen to scriptures, and reduce distractions. On Samvatsari, people say "Micchami Dukkadam" meaning "If I hurt you, I ask forgiveness."

Dos: Apologize sincerely and forgive for real.
Don'ts: Use forgiveness as a "reset button" then repeat the same harm. Don't judge others based on how strict their fast is.`,
        color: "from-sky-500 to-indigo-500"
    },
    {
        date: "2026-09-14",
        name: "🐘 Ganesh Chaturthi",
        hindi: "गणेश चतुर्थी",
        description: `What is it: This celebrates Lord Ganesha, known as the remover of obstacles and the god of wisdom and new beginnings. It's often celebrated for 1 day at home, or as a bigger community festival lasting several days.

Origin: It's connected to stories of Ganesha's birth and his role as a protector of good beginnings. Over time it became especially popular as a community festival in India and now worldwide.

How to celebrate: People bring a Ganesha idol (often eco-friendly), do prayers, offer sweets like modak, and sing aarti. At the end, some do immersion (visarjan) in a respectful, safe way.

Dos: Use eco-friendly idols and don't pollute water. Keep the message: wisdom + humility + good starts.
Don'ts: Blast loud sound late at night (respect neighbors).`,
        color: "from-orange-500 to-red-500"
    },
    {
        date: "2026-10-11",
        name: "🪔 Sharad Navratri Begins",
        hindi: "शारदीय नवरात्रि",
        description: `What is it: Navratri is nine nights honoring Goddess Durga in different forms. Some celebrate mainly with prayer and fasting, and others celebrate with garba/dandiya dance and cultural events.

Origin: It comes from stories where Durga defeats evil forces, showing courage and protection. The nine forms represent different strengths like bravery, wisdom, and patience.

How to celebrate: People do prayers, keep a small lamp, and some fast (often avoiding meat/alcohol). Communities do garba nights, and many end with special prayers or Kanya Puja (honoring young girls) in some traditions.

Dos: Be respectful at dances/temples (Navratri is spiritual + cultural).
Don'ts: Pressure people to fast. Don't treat women disrespectfully during a festival honoring the Goddess.`,
        color: "from-red-500 to-orange-500"
    },
    {
        date: "2026-10-20",
        name: "🏹 Vijayadashami / Dussehra",
        hindi: "विजयादशमी / दशहरा",
        description: `What is it: This is the "victory of good over evil" day at the end of Navratri. Many link it to Rama defeating Ravana and Durga defeating Mahishasura.

Origin: It comes from major Hindu epics and stories that teach: evil can look powerful, but it doesn't last. It became a yearly reminder to stand up for what's right.

How to celebrate: Some communities do Ramlila plays and burn Ravana effigies; others keep it simple with prayers and family meals. Many students also use it as a "start learning" day (good day to begin something).

Dos: Focus on self-control (beat your own bad habits).
Don'ts: Use the "enemy story" to hate real groups of people — this is symbolic.`,
        color: "from-red-500 to-orange-500"
    },
    {
        date: "2026-10-29",
        name: "🌙 Karwa Chauth",
        hindi: "करवा चौथ",
        description: `What is it: This is a fasting day mostly observed by married women (and sometimes couples together) for a spouse's well-being. People fast from morning until they see the moon at night.

Origin: It's tied to folk stories about loyalty, prayer, and family life. Over time it became especially popular in North India and among diaspora families.

How to celebrate: People dress up, do an evening prayer, listen to the story, and break the fast after moonrise. Some families keep it modern: they focus on love, support, and healthy boundaries.

Dos: Keep health first; if fasting isn't safe, don't do it.
Don'ts: Pressure anyone (especially women) into fasting. Don't make love "prove itself" through suffering.`,
        color: "from-red-500 to-pink-500"
    },
    {
        date: "2026-11-08",
        name: "🪔 Diwali — Festival of Lights",
        hindi: "दीवाली",
        description: `What is it: Diwali is the festival of lights, celebrating hope, knowledge, and goodness winning over darkness. It's usually a multi-day season, but the main "Diwali day" is this date on many calendars.

Origin: Many connect Diwali to Rama returning home after victory, and also to Lakshmi (prosperity) being welcomed. The deeper idea is: light = clarity and goodness, not just lamps.

How to celebrate: Clean the home, light diyas/candles safely, do Lakshmi-Ganesha prayer, share sweets, and spend time with family. Many people also donate or help others, which fits the "light" theme.

Dos: Use safe/eco-friendly fireworks or skip them. Keep pets and little kids safe from noise.
Don'ts: Overspend or go into debt. Don't leave candles unattended or ignore fire safety.

Note (Jain): For Jains, this day also marks Mahavir Nirvan — Lord Mahavira's liberation. Jains celebrate with prayers and reflection, keeping it peaceful and meaningful.`,
        color: "from-yellow-500 to-orange-500"
    },
    {
        date: "2026-11-10",
        name: "🧁 Govardhan Puja / Annakut",
        hindi: "गोवर्धन पूजा / अन्नकूट",
        description: `What is it: This celebrates Krishna protecting people and also celebrates gratitude through food offerings ("Annakut" means a mountain of food). It's commonly celebrated just after Diwali in many traditions.

Origin: The story says Krishna encouraged people to respect nature and community instead of fear-based worship. The festival became a reminder of protection, humility, and gratitude.

How to celebrate: People make many dishes, offer them in prayer, then share as prasad. Temples sometimes do big food displays.

Dos: Donate food or share with neighbors.
Don'ts: Waste food — this festival is literally about gratitude for food.`,
        color: "from-green-500 to-teal-500"
    },
    {
        date: "2026-11-11",
        name: "👧👦 Bhai Dooj",
        hindi: "भाई दूज",
        description: `What is it: This is a sibling festival after Diwali, focusing on brother–sister bonding (or siblings in general). Sisters do a small tilak and prayer, and siblings share food and gifts.

Origin: It comes from traditional stories and the general Indian tradition of honoring family bonds during festival season.

How to celebrate: Tilak, sweets, a family meal, and a genuine talk about supporting each other.

Dos: Keep it warm and respectful.
Don'ts: Make it about expensive gifts.`,
        color: "from-pink-500 to-purple-500"
    },
    {
        date: "2026-11-05",
        name: "Chhath Puja",
        hindi: "छठ पूजा",
        description: "Chhath Puja is an ancient Hindu festival dedicated to the Sun God (Surya) and Chhathi Maiya (Goddess Usha). Devotees observe rigorous fasting for 36 hours without water, stand in water bodies, and offer prayers to the rising and setting sun. Originating in Bihar, it has spread across India and symbolizes purity, gratitude, and cosmic energy.",
        color: "from-orange-500 to-yellow-500"
    },
    {
        date: "2026-11-24",
        name: "Guru Nanak Jayanti",
        hindi: "गुरु नानक जयंती",
        description: "Guru Nanak Jayanti celebrates the birth of Guru Nanak Dev Ji, the founder of Sikhism and the first of the ten Sikh Gurus. Sikhs hold processions (Nagar Kirtan), continuous readings of the Guru Granth Sahib, and community meals (langar). Guru Nanak's teachings emphasize equality, honest living, sharing with others, and remembrance of God.",
        color: "from-orange-500 to-blue-500"
    },
    {
        date: "2026-12-25",
        name: "Christmas (observed in India)",
        hindi: "क्रिसमस",
        description: "While primarily a Christian holiday, Christmas is widely celebrated in India's secular society. Indian Christians attend midnight mass, decorate homes and churches, and exchange gifts. In many regions, banana or mango trees are decorated instead of pine trees. The festival promotes universal values of love, peace, and goodwill toward all.",
        color: "from-red-500 to-green-500"
    }
];

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function IndianCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
    const year = 2026;

    const holidaysInMonth = INDIAN_HOLIDAYS_2026.filter(h => {
        const date = new Date(h.date);
        return date.getMonth() === currentMonth;
    });

    const prevMonth = () => setCurrentMonth(m => m === 0 ? 11 : m - 1);
    const nextMonth = () => setCurrentMonth(m => m === 11 ? 0 : m + 1);

    return (
        <Card className="bg-slate-800/50 backdrop-blur-sm border-amber-400/20 min-h-[500px]">
            <CardHeader className="pb-3 border-b border-navy-600" style={{ borderBottomColor: '#1e3a5f' }}>
                <CardTitle className="text-amber-100 font-serif flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    Indian Festival Calendar 2026
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevMonth}
                        className="text-amber-300 hover:bg-amber-500/20"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-xl font-medium text-amber-100">
                        {MONTHS[currentMonth]} {year}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="text-amber-300 hover:bg-amber-500/20"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Holidays List */}
                <div className="space-y-3 min-h-[350px]">
                    {holidaysInMonth.length === 0 ? (
                        <p className="text-amber-300/50 text-sm text-center py-12">
                            No major festivals this month
                        </p>
                    ) : (
                        holidaysInMonth.map((holiday, idx) => (
                            <motion.button
                                key={holiday.date}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setSelectedHoliday(holiday)}
                                className={`w-full p-4 rounded-xl bg-gradient-to-r ${holiday.color} text-white text-left hover:scale-[1.02] transition-transform shadow-lg`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{holiday.name}</p>
                                        <p className="text-xs opacity-80">{holiday.hindi}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            {new Date(holiday.date).getDate()}
                                        </p>
                                        <Sparkles className="w-3 h-3 opacity-70" />
                                    </div>
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Holiday Detail Modal */}
                <AnimatePresence>
                    {selectedHoliday && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                            onClick={() => setSelectedHoliday(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className={`max-w-lg w-full rounded-2xl overflow-hidden bg-gradient-to-br ${selectedHoliday.color} p-1`}
                            >
                                <div className="bg-slate-900 rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-serif text-amber-100">{selectedHoliday.name}</h3>
                                            <p className="text-amber-300">{selectedHoliday.hindi}</p>
                                            <p className="text-sm text-amber-300/60 mt-1">
                                                {new Date(selectedHoliday.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedHoliday(null)}
                                            className="text-amber-300 hover:bg-amber-500/20"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <p className="text-amber-100/90 leading-relaxed text-sm whitespace-pre-line">
                                       {selectedHoliday.description}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}