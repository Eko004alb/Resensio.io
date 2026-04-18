// Perth Alexithymia Questionnaire (PAQ)
// Preece et al. (2018) — Journal of Affective Disorders
// 24 items, 5-point Likert scale (1 = Strongly Disagree, 5 = Strongly Agree)

export type PAQSubscale = 'ndif' | 'pdif' | 'nddf' | 'pddf' | 'eot';

export interface PAQQuestion {
  id: number;
  text: string;
  subscale: PAQSubscale;
  reversed: boolean;
}

export const PAQ_QUESTIONS: PAQQuestion[] = [
  // N-DIF — Negative Difficulty Identifying Feelings (items 1–5)
  { id: 1,  text: "When I am upset, I am often confused about what emotion I am feeling.",                           subscale: 'ndif', reversed: false },
  { id: 2,  text: "When something bad happens, I have difficulty knowing what emotion I am feeling.",               subscale: 'ndif', reversed: false },
  { id: 3,  text: "When I feel a negative emotion, I struggle to know which emotion I am experiencing.",            subscale: 'ndif', reversed: false },
  { id: 4,  text: "When I am distressed, I am unsure what emotion I am feeling.",                                  subscale: 'ndif', reversed: false },
  { id: 5,  text: "When I feel bad, I am unable to identify what the emotion is.",                                  subscale: 'ndif', reversed: false },

  // P-DIF — Positive Difficulty Identifying Feelings (items 6–10)
  { id: 6,  text: "When I feel good, I often don't know what positive emotion I am feeling.",                       subscale: 'pdif', reversed: false },
  { id: 7,  text: "When something good happens, I have difficulty identifying the emotion I am experiencing.",      subscale: 'pdif', reversed: false },
  { id: 8,  text: "When I experience positive feelings, I struggle to know which emotion it is.",                   subscale: 'pdif', reversed: false },
  { id: 9,  text: "When I am feeling positive, I am unsure what emotion I am feeling.",                            subscale: 'pdif', reversed: false },
  { id: 10, text: "When I feel a positive emotion, I am unable to identify what the emotion is.",                   subscale: 'pdif', reversed: false },

  // N-DDF — Negative Difficulty Describing Feelings (items 11–15)
  { id: 11, text: "When I feel a negative emotion, I struggle to put it into words.",                               subscale: 'nddf', reversed: false },
  { id: 12, text: "When I am upset, I find it difficult to describe my feelings to others.",                        subscale: 'nddf', reversed: false },
  { id: 13, text: "When I am distressed, I have difficulty describing what emotion I am experiencing.",             subscale: 'nddf', reversed: false },
  { id: 14, text: "I struggle to put words to how I feel when experiencing negative emotions.",                     subscale: 'nddf', reversed: false },
  { id: 15, text: "When I feel bad, I am unable to communicate what emotion I am experiencing.",                    subscale: 'nddf', reversed: false },

  // P-DDF — Positive Difficulty Describing Feelings (items 16–20)
  { id: 16, text: "When I feel a positive emotion, I struggle to express it in words.",                             subscale: 'pddf', reversed: false },
  { id: 17, text: "When I feel good, I find it difficult to describe my feelings to others.",                       subscale: 'pddf', reversed: false },
  { id: 18, text: "When I am experiencing positive feelings, I have difficulty describing them.",                   subscale: 'pddf', reversed: false },
  { id: 19, text: "I struggle to put words to how I feel when experiencing positive emotions.",                     subscale: 'pddf', reversed: false },
  { id: 20, text: "When I feel happy, I am unable to communicate what emotion I am experiencing.",                  subscale: 'pddf', reversed: false },

  // EOT — Externally-Oriented Thinking (items 21–24)
  { id: 21, text: "I prefer to focus on activities rather than on my feelings.",                                    subscale: 'eot',  reversed: false },
  { id: 22, text: "I prefer to analyze problems rather than reflect on my emotional experiences.",                  subscale: 'eot',  reversed: false },
  { id: 23, text: "I would rather watch action movies than emotional dramas.",                                      subscale: 'eot',  reversed: false },
  { id: 24, text: "I think it is pointless to look inside oneself for the meaning of one's feelings.",              subscale: 'eot',  reversed: false },
];

export const PAQ_SUBSCALE_INFO: Record<PAQSubscale, { label: string; color: string }> = {
  ndif: { label: 'Negative Difficulty Identifying Feelings', color: 'indigo'  },
  pdif: { label: 'Positive Difficulty Identifying Feelings', color: 'teal'    },
  nddf: { label: 'Negative Difficulty Describing Feelings',  color: 'violet'  },
  pddf: { label: 'Positive Difficulty Describing Feelings',  color: 'purple'  },
  eot:  { label: 'Externally-Oriented Thinking',             color: 'rose'    },
};

export const PAQ_SUBSCALE_MAX: Record<PAQSubscale, number> = {
  ndif: 25,
  pdif: 25,
  nddf: 25,
  pddf: 25,
  eot:  20,
};

export const PAQ_LIKERT_LABELS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
];
