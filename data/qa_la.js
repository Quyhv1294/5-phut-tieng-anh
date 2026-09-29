  // Hỏi-đáp — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Câu. Trò chơi nối câu hỏi với câu trả lời
  // đúng (giống cơ chế Ghép hình/Ghép tranh nhưng nối câu thay vì hình-từ). Mỗi nhóm bám theo đúng 1
  // chủ đề từ vựng đã học ở Từ vựng Lớp Lá (vocab_la.js) để hỏi-đáp có ngữ cảnh quen thuộc.
  const QA_LA_TOPICS = [
    { id: 'qa_school', label: 'Môn học', emoji: '🔢', cls: 't-blue',
      pairs: [
        { q: 'What is your favorite subject?', a: 'My favorite subject is Math.' },
        { q: 'Do you like Art class?', a: 'Yes, I like Art class.' },
        { q: 'What time is Music class?', a: 'Music class is in the morning.' },
        { q: 'Who is your teacher?', a: 'My teacher is Ms. Lan.' },
        { q: 'Do you study English every day?', a: 'Yes, I study English every day.' },
        { q: 'Is Science difficult?', a: 'No, Science is not difficult.' },
      ] },
    { id: 'qa_hobbies', label: 'Sở thích', emoji: '📖', cls: 't-pink',
      pairs: [
        { q: 'What is your hobby?', a: 'My hobby is reading.' },
        { q: 'Do you like drawing?', a: 'Yes, I love drawing.' },
        { q: 'Can you swim?', a: 'Yes, I can swim well.' },
        { q: 'What sport do you play?', a: 'I play football with friends.' },
        { q: 'Do you like singing?', a: 'Yes, singing makes me happy.' },
        { q: 'What do you do after school?', a: 'I go dancing after school.' },
      ] },
    { id: 'qa_time', label: 'Thời gian', emoji: '🌅', cls: 't-gold',
      pairs: [
        { q: 'What time do you wake up?', a: 'I wake up in the morning.' },
        { q: 'When do you eat dinner?', a: 'I eat dinner in the evening.' },
        { q: 'What day is today?', a: 'Today is Monday.' },
        { q: 'What do you do at night?', a: 'I sleep at night.' },
        { q: 'When do you play outside?', a: 'I play outside in the afternoon.' },
        { q: 'What is tomorrow?', a: 'Tomorrow is a new day.' },
      ] },
    { id: 'qa_shopping', label: 'Mua sắm', emoji: '🛒', cls: 't-mint',
      pairs: [
        { q: 'How much is the toy?', a: 'The toy is five dollars.' },
        { q: 'Do you have any money?', a: 'Yes, I have one coin.' },
        { q: 'Where do you buy food?', a: 'I buy food at the store.' },
        { q: 'Who sells fruit here?', a: 'They sell fruit here.' },
        { q: 'Can I save my money?', a: 'Yes, you can save your money.' },
        { q: 'What do you want to buy?', a: 'I want to buy a toy.' },
      ] },
    { id: 'qa_health', label: 'Sức khỏe', emoji: '🤒', cls: 't-accent',
      pairs: [
        { q: 'How do you feel today?', a: 'I feel sick today.' },
        { q: 'What do you take when you are sick?', a: 'I take medicine when I am sick.' },
        { q: 'Do you exercise every day?', a: 'Yes, I exercise every morning.' },
        { q: 'Why do vegetables help you?', a: 'Vegetables make me healthy.' },
        { q: 'What do you need when you are tired?', a: 'I need to rest now.' },
        { q: 'Do you have a fever?', a: 'Yes, I have a fever.' },
      ] },
  ];
