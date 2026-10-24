/*
  Quiz data for Quiz Quest.
  To make a new game, copy this folder and edit this file only.

  Multiple choice:  { topic, q, options: [..4], answer: <index of correct option, 0 = A>, level, img? , cue? }
  Write the answer: { topic, q, type: "write", answer: "Full sentence.", alt?: "Other accepted form", level, img?, cue? }
  level 1 = easy (10 pts), 2 = medium (15 pts), 3 = hard (20 pts) when "By difficulty" points are chosen.
*/
window.QUIZ = {
  id: "share-it-3-unit1-2",
  title: "Unit 1 & 2 Review",
  subtitle: "Share It 3 · Family & Healthy Food",
  questions: [
    // Unit 1 — Family words
    { id: 1, topic: "Family", level: 1, q: "Mom + Dad = my ___.", options: ["grandparents", "parents", "cousins", "aunts"], answer: 1 },
    { id: 2, topic: "Family", level: 1, q: "Mom's brother = my ___.", options: ["aunt", "cousin", "little sister", "uncle"], answer: 3 },
    { id: 3, topic: "Family", level: 1, q: "Dad's sister = my ___.", options: ["aunt", "uncle", "big brother", "parents"], answer: 0 },
    { id: 4, topic: "Family", level: 1, q: "My aunt and uncle's kids = my ___.", options: ["aunts", "grandparents", "cousins", "little sisters"], answer: 2 },
    { id: 5, topic: "Family", level: 1, q: "Grandma + Grandpa = my ___.", options: ["parents", "grandparents", "cousins", "uncles"], answer: 1 },

    // Unit 1 — Personal things
    { id: 6, topic: "My things", level: 1, img: "images/Q6.png", q: "What are these?", options: ["keys", "sandals", "glasses", "wallets"], answer: 2 },
    { id: 7, topic: "My things", level: 1, img: "images/Q7.png", q: "What are these?", options: ["keys", "glasses", "e-readers", "sandals"], answer: 0 },
    { id: 8, topic: "My things", level: 1, img: "images/Q8.png", q: "What's this?", options: ["wallet", "e-reader", "comic book", "cell phone"], answer: 3 },
    { id: 9, topic: "My things", level: 1, img: "images/Q9.png", q: "What are these?", options: ["glasses", "sandals", "keys", "comic books"], answer: 1 },
    { id: 10, topic: "My things", level: 1, img: "images/Q10.png", q: "What's this?", options: ["e-reader", "cell phone", "wallet", "comic book"], answer: 0 },
    { id: 11, topic: "My things", level: 1, img: "images/Q11.png", q: "What's this?", options: ["comic book", "cell phone", "wallet", "e-reader"], answer: 2 },
    { id: 12, topic: "My things", level: 1, img: "images/Q12.png", q: "What's this?", options: ["wallet", "comic book", "e-reader", "cell phone"], answer: 1 },

    // Unit 1 — Who's...? / Whose...? (full-sentence answers)
    { id: 13, topic: "Who's…? Whose…?", level: 3, img: "images/Q13.png", q: "Who's she?", options: ["He's my aunt.", "She's my aunt.", "She's my uncle.", "They're my aunt."], answer: 1 },
    { id: 14, topic: "Who's…? Whose…?", level: 3, img: "images/Q14.png", q: "Who are they?", options: ["She's my grandparents.", "They're my parents.", "They're my grandparents.", "He's my grandparents."], answer: 2 },
    { id: 15, topic: "Who's…? Whose…?", level: 3, img: "images/Q15.png", q: "These are Tom's keys. Whose keys are these?", options: ["They're his.", "They're hers.", "It's his.", "They're mine."], answer: 0 },
    { id: 16, topic: "Who's…? Whose…?", level: 3, img: "images/Q16.png", q: "This is Mai's cell phone. Whose cell phone is this?", options: ["It's his.", "They're hers.", "It's mine.", "It's hers."], answer: 3 },
    { id: 17, topic: "Who's…? Whose…?", level: 3, img: "images/Q17.png", q: "These are my glasses. Whose glasses are these?", options: ["They're yours.", "They're mine.", "It's mine.", "They're his."], answer: 1 },
    { id: 18, topic: "Who's…? Whose…?", level: 3, img: "images/Q18.png", q: "These are Ben and Lily's comic books. Whose comic books are these?", options: ["They're ours.", "They're his.", "They're theirs.", "It's theirs."], answer: 2 },

    // Unit 2 — Fruit, vegetables, food and drinks
    { id: 19, topic: "Healthy food", level: 1, img: "images/Q19.png", q: "What are these?", options: ["peaches", "mangoes", "avocados", "potatoes"], answer: 1 },
    { id: 20, topic: "Healthy food", level: 1, img: "images/Q20.png", q: "What are these?", options: ["potatoes", "tomatoes", "carrots", "mangoes"], answer: 0 },
    { id: 21, topic: "Healthy food", level: 1, img: "images/Q21.png", q: "What are these?", options: ["tomatoes", "avocados", "peaches", "cucumbers"], answer: 2 },
    { id: 22, topic: "Healthy food", level: 1, img: "images/Q22.png", q: "What are these?", options: ["cucumbers", "potatoes", "mangoes", "carrots"], answer: 3 },
    { id: 23, topic: "Healthy food", level: 1, img: "images/Q23.png", q: "What are these?", options: ["tomatoes", "peaches", "carrots", "avocados"], answer: 0 },
    { id: 24, topic: "Healthy food", level: 1, img: "images/Q24.png", q: "What are these?", options: ["avocados", "cucumbers", "carrots", "potatoes"], answer: 1 },
    { id: 25, topic: "Healthy food", level: 1, img: "images/Q25.png", q: "What are these?", options: ["mangoes", "cucumbers", "avocados", "peaches"], answer: 2 },
    { id: 26, topic: "Healthy food", level: 1, img: "images/Q26.png", q: "What's this?", options: ["popcorn", "beef", "chicken", "pasta"], answer: 3 },
    { id: 27, topic: "Healthy food", level: 1, img: "images/Q27.png", q: "What's this?", options: ["popcorn", "pasta", "tea", "soda"], answer: 0 },
    { id: 28, topic: "Healthy food", level: 1, img: "images/Q28.png", q: "What's this?", options: ["coffee", "lemonade", "tea", "soda"], answer: 1 },

    // Unit 2 — Food groups
    { id: 29, topic: "Food groups", level: 2, q: "Which one is a drink?", options: ["beef", "pasta", "tea", "carrots"], answer: 2 },
    { id: 30, topic: "Food groups", level: 2, q: "Which one is meat?", options: ["soda", "mangoes", "popcorn", "chicken"], answer: 3 },

    // Unit 2 — some / any, is / are
    { id: 31, topic: "some / any", level: 2, q: "There are ___ avocados.", options: ["any", "some", "a", "an"], answer: 1 },
    { id: 32, topic: "some / any", level: 2, q: "There aren't ___ apples.", options: ["some", "a", "any", "an"], answer: 2 },
    { id: 33, topic: "some / any", level: 2, q: "There ___ some soda.", options: ["is", "are", "isn't", "aren't"], answer: 0 },
    { id: 34, topic: "some / any", level: 2, q: "There ___ some carrots.", options: ["is", "isn't", "aren't", "are"], answer: 3 },
    { id: 35, topic: "some / any", level: 2, q: "Are there any tomatoes? – Yes, ___.", options: ["there is", "there are", "there isn't", "there aren't"], answer: 1 },
    { id: 36, topic: "some / any", level: 2, q: "Is there any coffee? – No, ___.", options: ["there aren't", "there is", "there are", "there isn't"], answer: 3 }
  ]
};
