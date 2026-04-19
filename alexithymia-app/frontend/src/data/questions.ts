export type Subscale = 'dif' | 'ddf' | 'eot';

export interface Question {
  id: number;
  text: string;
  subscale: Subscale;
  reversed: boolean;
}

export const QUESTIONS: Question[] = [
  { id: 1,  text: "Spesso non sono sicuro/a di quale emozione sto provando in quel momento.",                         subscale: 'dif', reversed: false },
  { id: 2,  text: "Faccio fatica a trovare le parole giuste per descrivere come mi sento.",                          subscale: 'ddf', reversed: false },
  { id: 3,  text: "A volte il mio corpo prova sensazioni che faccio fatica a spiegare a parole.",                    subscale: 'dif', reversed: false },
  { id: 4,  text: "Riesco a descrivere facilmente quello che provo dentro.",                                         subscale: 'ddf', reversed: true  },
  { id: 5,  text: "Preferisco ragionare su un problema piuttosto che limitarmi a descriverlo.",                      subscale: 'eot', reversed: true  },
  { id: 6,  text: "Quando sono turbato/a, non riesco a capire se mi sento triste, spaventato/a o arrabbiato/a.",    subscale: 'dif', reversed: false },
  { id: 7,  text: "Spesso le sensazioni che provo nel corpo mi lasciano confuso/a.",                                 subscale: 'dif', reversed: false },
  { id: 8,  text: "Preferisco lasciar andare le cose così come vengono, senza cercare di capirne il perché.",        subscale: 'eot', reversed: true  },
  { id: 9,  text: "Ho delle sensazioni dentro di me che non riesco bene a identificare.",                            subscale: 'dif', reversed: false },
  { id: 10, text: "Per me è importante essere in contatto con le proprie emozioni.",                                 subscale: 'eot', reversed: true  },
  { id: 11, text: "Trovo difficile spiegare a parole quello che provo per le persone a cui tengo.",                  subscale: 'ddf', reversed: false },
  { id: 12, text: "Le persone attorno a me mi chiedono di aprirmi di più su quello che provo.",                      subscale: 'ddf', reversed: false },
  { id: 13, text: "A volte sento che non capisco bene cosa sta succedendo dentro di me.",                            subscale: 'dif', reversed: false },
  { id: 14, text: "Spesso non riesco a capire il motivo per cui mi arrabbio.",                                       subscale: 'dif', reversed: false },
  { id: 15, text: "Quando parlo con qualcuno, preferisco concentrarmi su cosa fa piuttosto che su come si sente.",   subscale: 'eot', reversed: false },
  { id: 16, text: "Preferisco guardare qualcosa di leggero e divertente piuttosto che un film che parla di emozioni.", subscale: 'eot', reversed: false },
  { id: 17, text: "Faccio fatica a condividere quello che sento davvero, anche con le persone più vicine a me.",     subscale: 'ddf', reversed: false },
  { id: 18, text: "Posso sentirmi vicino/a a qualcuno anche stando in silenzio, senza bisogno di parole.",           subscale: 'eot', reversed: true  },
  { id: 19, text: "Riflettere su come mi sento mi aiuta a capire meglio me stesso/a e i miei problemi.",             subscale: 'eot', reversed: true  },
  { id: 20, text: "Cercare significati nascosti nei film o nelle storie mi distrae e mi impedisce di godermeli.",     subscale: 'eot', reversed: false },
];

export const SUBSCALE_INFO: Record<Subscale, { label: string; description: string; items: number[]; color: string }> = {
  dif: {
    label: 'Riconoscere le emozioni',
    description: "La capacità di accorgersi di quello che si prova e di dargli un nome.",
    items: [1, 3, 6, 7, 9, 13, 14],
    color: 'rose',
  },
  ddf: {
    label: 'Esprimere le emozioni',
    description: "La facilità con cui riesci a comunicare agli altri il tuo mondo interiore.",
    items: [2, 4, 11, 12, 17],
    color: 'amber',
  },
  eot: {
    label: 'Orientamento verso l\'esterno',
    description: "La tendenza a focalizzarsi su fatti concreti e sul mondo esterno più che sui propri stati interni.",
    items: [5, 8, 10, 15, 16, 18, 19, 20],
    color: 'sky',
  },
};

export const LIKERT_LABELS = [
  'Per nulla',
  'Poco',
  'A volte',
  'Abbastanza',
  'Completamente',
];
