  // Bài hát — nội dung RIÊNG của lớp Lá (7–8 tuổi), tab Học. Cùng shape và cùng màn phát nhạc với
  // Bài hát của lớp Chồi (songs_choi.js, xem startSong/playSongAll trong app.js, giờ nhận thêm tham
  // số mảng bài hát để dùng chung cho cả 2 lớp) — 6 bài đồng dao tiếng Anh kinh điển KHÁC hẳn 6 bài
  // của Chồi (Head Shoulders Knees and Toes, Twinkle Twinkle, If You're Happy, Rain Rain Go Away,
  // Old MacDonald, Wheels on the Bus) để bé lớp Lá có bài mới, không học lại y nguyên bài của Chồi.
  const SONGS_LA = [
    { id: 'song_la_row', title: 'Row, Row, Row Your Boat', titleVi: 'Chèo Thuyền', emoji: '🚣', cls: 't-blue',
      lines: [
        { en: 'Row, row, row your boat,', vi: 'Chèo, chèo, chèo thuyền của bạn,' },
        { en: 'Gently down the stream.', vi: 'Nhẹ nhàng xuôi theo dòng suối.' },
        { en: 'Merrily, merrily, merrily, merrily,', vi: 'Vui vẻ, vui vẻ, vui vẻ, vui vẻ,' },
        { en: 'Life is but a dream.', vi: 'Cuộc sống chỉ là một giấc mơ.' },
      ] },
    { id: 'song_la_abc', title: 'The Alphabet Song', titleVi: 'Bài Hát Bảng Chữ Cái', emoji: '🔤', cls: 't-pink',
      lines: [
        { en: 'A B C D E F G,', vi: 'A B C D E F G,' },
        { en: 'H I J K L M N O P,', vi: 'H I J K L M N O P,' },
        { en: 'Q R S and T U V,', vi: 'Q R S và T U V,' },
        { en: 'W X Y and Z.', vi: 'W X Y và Z.' },
        { en: 'Now I know my ABCs,', vi: 'Giờ mình đã thuộc bảng chữ cái,' },
        { en: "Next time won't you sing with me?", vi: 'Lần sau bạn hát cùng mình nhé?' },
      ] },
    { id: 'song_la_spider', title: 'Itsy Bitsy Spider', titleVi: 'Chú Nhện Tí Hon', emoji: '🕷️', cls: 't-gold',
      lines: [
        { en: 'The itsy bitsy spider climbed up the water spout.', vi: 'Chú nhện tí hon leo lên vòi nước.' },
        { en: 'Down came the rain and washed the spider out.', vi: 'Mưa rơi xuống cuốn trôi chú nhện.' },
        { en: 'Out came the sun and dried up all the rain.', vi: 'Mặt trời ló ra làm khô hết mưa.' },
        { en: 'And the itsy bitsy spider climbed up the spout again.', vi: 'Và chú nhện tí hon lại leo lên vòi nước.' },
      ] },
    { id: 'song_la_monkeys', title: 'Five Little Monkeys', titleVi: 'Năm Chú Khỉ Con', emoji: '🐒', cls: 't-mint',
      lines: [
        { en: 'Five little monkeys jumping on the bed.', vi: 'Năm chú khỉ con nhảy trên giường.' },
        { en: 'One fell off and bumped his head.', vi: 'Một chú ngã xuống và va đầu.' },
        { en: 'Mama called the doctor and the doctor said,', vi: 'Mẹ gọi bác sĩ và bác sĩ nói,' },
        { en: 'No more monkeys jumping on the bed!', vi: 'Không được nhảy trên giường nữa nhé!' },
      ] },
    { id: 'song_la_oldman', title: 'This Old Man', titleVi: 'Ông Già Này', emoji: '👴', cls: 't-accent',
      lines: [
        { en: 'This old man, he played one,', vi: 'Ông già này, ông chơi số một,' },
        { en: 'He played knick-knack on my thumb.', vi: 'Ông gõ lách cách trên ngón tay cái của tôi.' },
        { en: 'With a knick-knack paddywhack, give a dog a bone,', vi: 'Với tiếng lách cách vui tai, cho chú chó một cái xương,' },
        { en: 'This old man came rolling home.', vi: 'Ông già này lăn về nhà.' },
      ] },
    { id: 'song_la_lamb', title: 'Mary Had a Little Lamb', titleVi: 'Mary Có Một Chú Cừu Nhỏ', emoji: '🐑', cls: 't-pink',
      lines: [
        { en: 'Mary had a little lamb,', vi: 'Mary có một chú cừu nhỏ,' },
        { en: 'Its fleece was white as snow.', vi: 'Lông nó trắng như tuyết.' },
        { en: 'Everywhere that Mary went,', vi: 'Bất cứ nơi nào Mary đi,' },
        { en: 'The lamb was sure to go.', vi: 'Chú cừu chắc chắn cũng đi theo.' },
      ] },
  ];
