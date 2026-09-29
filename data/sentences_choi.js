  // Ghép câu — nội dung RIÊNG của lớp Chồi (5–6 tuổi), tab "Câu". Bé bấm các từ theo đúng thứ tự để
  // ghép thành câu hoàn chỉnh. Mọi câu đều dài 3–4 từ, xoay quanh vài mẫu câu cố định (I see... /
  // This is my... / I have a... / I like... / I can... / The ... is ...) để bé quen cấu trúc thay vì
  // học thuộc từng câu rời rạc. Mỗi nhóm 6 câu, mỗi lượt chơi lấy ngẫu nhiên 5 câu.
  // en: câu tiếng Anh có dấu chấm cuối (app tự tách từ + bỏ dấu chấm khi làm ô chữ); vi: nghĩa gợi ý.
  const SENTENCE_BUILD_TOPICS = [
    { id: 'sb_see', label: 'Tôi thấy… (I see)', emoji: '👀', cls: 't-pink',
      sentences: [
        { en: 'I see a cat.', vi: 'Con thấy một con mèo.', emoji: '🐱' },
        { en: 'I see a dog.', vi: 'Con thấy một con chó.', emoji: '🐶' },
        { en: 'I see a bird.', vi: 'Con thấy một con chim.', emoji: '🐦' },
        { en: 'I see a fish.', vi: 'Con thấy một con cá.', emoji: '🐟' },
        { en: 'I see a bus.', vi: 'Con thấy một chiếc xe buýt.', emoji: '🚌' },
        { en: 'I see the sun.', vi: 'Con thấy mặt trời.', emoji: '☀️' },
      ] },
    { id: 'sb_this', label: 'Đây là… (This is)', emoji: '👉', cls: 't-blue',
      sentences: [
        { en: 'This is my mom.', vi: 'Đây là mẹ của con.', emoji: '👩' },
        { en: 'This is my dad.', vi: 'Đây là ba của con.', emoji: '👨' },
        { en: 'This is my bag.', vi: 'Đây là cặp của con.', emoji: '🎒' },
        { en: 'This is my book.', vi: 'Đây là quyển sách của con.', emoji: '📖' },
        { en: 'This is my ball.', vi: 'Đây là quả bóng của con.', emoji: '⚽' },
        { en: 'This is my bed.', vi: 'Đây là giường của con.', emoji: '🛏️' },
      ] },
    { id: 'sb_have', label: 'Tôi có… (I have)', emoji: '🎁', cls: 't-gold',
      sentences: [
        { en: 'I have a hat.', vi: 'Con có một cái mũ.', emoji: '🎩' },
        { en: 'I have a kite.', vi: 'Con có một con diều.', emoji: '🪁' },
        { en: 'I have a car.', vi: 'Con có một chiếc xe hơi.', emoji: '🚗' },
        { en: 'I have a bike.', vi: 'Con có một chiếc xe đạp.', emoji: '🚲' },
        { en: 'I have a pen.', vi: 'Con có một cây bút.', emoji: '🖊️' },
        { en: 'I have a drum.', vi: 'Con có một cái trống.', emoji: '🥁' },
      ] },
    { id: 'sb_like', label: 'Tôi thích… (I like)', emoji: '💚', cls: 't-mint',
      sentences: [
        { en: 'I like milk.', vi: 'Con thích sữa.', emoji: '🥛' },
        { en: 'I like rice.', vi: 'Con thích cơm.', emoji: '🍚' },
        { en: 'I like cake.', vi: 'Con thích bánh kem.', emoji: '🍰' },
        { en: 'I like eggs.', vi: 'Con thích trứng.', emoji: '🥚' },
        { en: 'I like apples.', vi: 'Con thích táo.', emoji: '🍎' },
        { en: 'I like bananas.', vi: 'Con thích chuối.', emoji: '🍌' },
      ] },
    { id: 'sb_can', label: 'Tôi biết… (I can)', emoji: '💪', cls: 't-accent',
      sentences: [
        { en: 'I can run.', vi: 'Con biết chạy.', emoji: '🏃' },
        { en: 'I can jump.', vi: 'Con biết nhảy.', emoji: '🤸' },
        { en: 'I can swim.', vi: 'Con biết bơi.', emoji: '🏊' },
        { en: 'I can sing.', vi: 'Con biết hát.', emoji: '🎤' },
        { en: 'I can read.', vi: 'Con biết đọc.', emoji: '📖' },
        { en: 'I can draw.', vi: 'Con biết vẽ.', emoji: '🎨' },
      ] },
    { id: 'sb_is', label: 'Nó thế nào? (…is…)', emoji: '🔍', cls: 't-pink',
      sentences: [
        { en: 'The sun is hot.', vi: 'Mặt trời nóng.', emoji: '🥵' },
        { en: 'The ice is cold.', vi: 'Cục đá lạnh.', emoji: '🧊' },
        { en: 'The dog is big.', vi: 'Con chó to.', emoji: '🐕' },
        { en: 'The ant is small.', vi: 'Con kiến nhỏ.', emoji: '🐜' },
        { en: 'The sky is blue.', vi: 'Bầu trời màu xanh.', emoji: '🌤️' },
        { en: 'The apple is red.', vi: 'Quả táo màu đỏ.', emoji: '🍎' },
      ] },
  ];
