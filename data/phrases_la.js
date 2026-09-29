  // Cụm từ thông dụng nâng cao — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Học. Tương đương "Từ hay
  // gặp" của lớp Chồi (sight_choi.js) nhưng là CẢ CỤM/CÂU bé dùng thật ở lớp học, ở nhà, khi chơi cùng
  // bạn — không phải từ đơn. Cùng shape { en, vi, example, exampleVi } và dùng lại NGUYÊN màn học/đố
  // của Từ hay gặp (xem startSight trong app.js, giờ nhận thêm tham số mảng chủ đề để dùng chung cho
  // cả 2 lớp) — "example"/"exampleVi" ở đây là 1 câu trả lời/tình huống ngắn đi kèm cụm từ.
  const PHRASES_LA_TOPICS = [
    { id: 'phrase_class', label: 'Trong lớp học', emoji: '🏫', cls: 't-blue',
      words: [
        { en: 'Can I go to the bathroom?', vi: 'Con xin phép đi vệ sinh được không ạ?', example: 'Yes, go ahead.', exampleVi: 'Được, con đi đi.' },
        { en: 'May I have some water?', vi: 'Con xin một ít nước được không ạ?', example: 'Sure, here you go.', exampleVi: 'Được chứ, của con đây.' },
        { en: "I don't understand.", vi: 'Con chưa hiểu ạ.', example: "That's okay, let me explain again.", exampleVi: 'Không sao, cô giải thích lại nhé.' },
        { en: 'Can you repeat that, please?', vi: 'Cô nói lại được không ạ?', example: 'Of course, listen again.', exampleVi: 'Được chứ, nghe lại nhé.' },
        { en: 'Excuse me, may I ask a question?', vi: 'Xin phép cho con hỏi một câu ạ?', example: 'Yes, go ahead and ask.', exampleVi: 'Được, con hỏi đi.' },
        { en: "I'm finished.", vi: 'Con làm xong rồi ạ.', example: 'Great job, well done!', exampleVi: 'Giỏi quá, làm tốt lắm!' },
      ] },
    { id: 'phrase_polite', label: 'Xin phép & lịch sự', emoji: '🙏', cls: 't-pink',
      words: [
        { en: 'Excuse me.', vi: 'Xin lỗi (để gây chú ý).', example: 'Excuse me, is this seat free?', exampleVi: 'Xin lỗi, chỗ này còn trống không ạ?' },
        { en: "I'm sorry.", vi: 'Con xin lỗi.', example: "I'm sorry, I made a mistake.", exampleVi: 'Con xin lỗi, con đã làm sai.' },
        { en: 'Thank you very much.', vi: 'Con cảm ơn rất nhiều.', example: "You're very welcome.", exampleVi: 'Không có gì đâu.' },
        { en: "You're welcome.", vi: 'Không có gì.', example: 'Thank you! / / You are welcome.', exampleVi: 'Cảm ơn bạn! / Không có gì.' },
        { en: 'Please wait a minute.', vi: 'Xin đợi một chút ạ.', example: 'Okay, I will wait.', exampleVi: 'Được, mình sẽ đợi.' },
        { en: 'Nice to meet you.', vi: 'Rất vui được gặp bạn.', example: 'Nice to meet you too!', exampleVi: 'Mình cũng rất vui được gặp bạn!' },
      ] },
    { id: 'phrase_feelings', label: 'Cảm xúc & tình huống', emoji: '🙂', cls: 't-gold',
      words: [
        { en: 'I feel great today.', vi: 'Hôm nay con thấy rất khỏe.', example: "That's wonderful to hear!", exampleVi: 'Nghe tuyệt quá!' },
        { en: "I'm a little tired.", vi: 'Con hơi mệt một chút.', example: 'You should rest for a while.', exampleVi: 'Con nên nghỉ một lát nhé.' },
        { en: 'I need some help.', vi: 'Con cần một chút giúp đỡ.', example: 'Sure, I will help you.', exampleVi: 'Được, mình sẽ giúp bạn.' },
        { en: 'Everything is okay.', vi: 'Mọi thứ đều ổn.', example: "I'm glad to hear that.", exampleVi: 'Nghe vậy mình vui quá.' },
        { en: 'I made a mistake.', vi: 'Con đã làm sai.', example: "That's okay, everyone makes mistakes.", exampleVi: 'Không sao, ai cũng có lúc sai mà.' },
        { en: "Let's try again.", vi: 'Mình thử lại lần nữa nhé.', example: 'Okay, let\'s try together.', exampleVi: 'Được, cùng thử lại nhé.' },
      ] },
    { id: 'phrase_home', label: 'Ở nhà', emoji: '🏠', cls: 't-mint',
      words: [
        { en: 'Can I watch TV?', vi: 'Con xem tivi được không ạ?', example: 'Yes, but only for a little while.', exampleVi: 'Được, nhưng chỉ một lát thôi nhé.' },
        { en: "I'm going to bed.", vi: 'Con đi ngủ đây.', example: 'Good night, sleep well.', exampleVi: 'Chúc con ngủ ngon.' },
        { en: "Let's clean up together.", vi: 'Mình cùng dọn dẹp nhé.', example: "Great idea, let's start now.", exampleVi: 'Ý hay đấy, mình bắt đầu thôi.' },
        { en: 'Dinner is ready.', vi: 'Cơm tối xong rồi.', example: "I'm coming!", exampleVi: 'Con ra ngay đây!' },
        { en: 'I already did my homework.', vi: 'Con đã làm xong bài tập rồi.', example: "Great, now you can play.", exampleVi: 'Giỏi quá, giờ con chơi được rồi.' },
        { en: 'Can I play outside?', vi: 'Con ra ngoài chơi được không ạ?', example: 'Yes, but come back before dark.', exampleVi: 'Được, nhưng phải về trước khi trời tối nhé.' },
      ] },
    { id: 'phrase_friends', label: 'Bạn bè & vui chơi', emoji: '🤝', cls: 't-accent',
      words: [
        { en: 'Do you want to play with me?', vi: 'Bạn có muốn chơi cùng mình không?', example: 'Yes, I would love to!', exampleVi: 'Có chứ, mình rất thích!' },
        { en: "It's your turn now.", vi: 'Đến lượt bạn rồi đó.', example: 'Okay, thank you.', exampleVi: 'Được rồi, cảm ơn bạn.' },
        { en: 'Good job!', vi: 'Làm tốt lắm!', example: 'Thank you, you too!', exampleVi: 'Cảm ơn bạn, bạn cũng vậy!' },
        { en: "Let's be friends.", vi: 'Mình làm bạn nhé.', example: 'Sure, let\'s be friends!', exampleVi: 'Được chứ, mình làm bạn nhé!' },
        { en: 'Wait for me!', vi: 'Đợi mình với!', example: 'Okay, I will wait for you.', exampleVi: 'Được, mình sẽ đợi bạn.' },
        { en: 'That was so much fun!', vi: 'Vui quá đi mất!', example: 'Yes, let\'s play again tomorrow.', exampleVi: 'Ừ, mai mình chơi tiếp nhé.' },
      ] },
  ];
