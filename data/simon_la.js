  // Simon nói nâng cao — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Trò chơi. Cùng cơ chế với Simon
  // nói của lớp Chồi (Simon nói "Simon says" trước thì làm theo, quên nói thì đứng yên) nhưng mỗi
  // lệnh có HAI hành động liền nhau thay vì một (khó hơn vì phải nghe hiểu cả câu dài rồi nhớ đủ cả
  // 2 việc) — xem getSimonPool/buildSimonRounds trong app.js. 10 lệnh (nhiều hơn 8 lệnh của Chồi) để
  // mỗi ván xáo ra vẫn còn vài lệnh khác nhau giữa các lượt chơi lại.
  const SIMON_LA_COMMANDS = [
    { en: 'Touch your head and jump', emoji: '🙆🤸' },
    { en: 'Clap your hands and spin around', emoji: '👏🌀' },
    { en: 'Wave your arms and sit down', emoji: '👋⬇️' },
    { en: 'Stand up and touch your toes', emoji: '🧍👣' },
    { en: 'Raise your hand and smile', emoji: '✋😊' },
    { en: 'Stomp your feet and clap', emoji: '🦶👏' },
    { en: 'Turn around and wave', emoji: '🔄👋' },
    { en: 'Reach up high and jump', emoji: '⬆️🤸' },
    { en: 'Cross your arms and freeze', emoji: '✖️🧊' },
    { en: 'Bend your knees and stretch', emoji: '🦵🙆' },
  ];
