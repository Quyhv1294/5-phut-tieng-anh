// CẨM NANG CHO BA MẸ — mẹo dạy bé tại nhà theo từng chủ đề từ vựng (app.js: màn "Xong", bảng chủ đề, Góc ba mẹ ›
// Cẩm nang). Mỗi chủ đề có 2 phần ngắn, ba mẹ làm được ngay không cần chuẩn bị nhiều:
//   tip  = mẹo dùng từ trong sinh hoạt hằng ngày (1–2 câu)
//   play = 1 trò chơi 5 phút cùng bé
// Khoá = id chủ đề trong data/topics.js (Mầm), vocab_choi.js (Chồi), vocab_la.js (Lá). Người duyệt nội dung chỉ cần sửa file này.
const PARENT_GUIDE = {
  // ---------- Lớp Mầm ----------
  family: {
    tip: "Chỉ vào từng người trong nhà và nói tên bằng tiếng Anh: 'This is Mom.' Mỗi ngày chỉ cần 1–2 người là đủ.",
    play: "Chơi 'Ai đây?': ba mẹ đưa ảnh gia đình, bé gọi tên người trong ảnh bằng tiếng Anh rồi ôm người đó (HUG).",
  },
  animals: {
    tip: "Xem ảnh hoặc video con vật rồi bắt chước tiếng kêu. Nói tên con vật bằng tiếng Anh trước, tiếng Việt sau.",
    play: "Chơi 'Con gì kêu?': ba mẹ kêu 'meo meo', 'gâu gâu'…, bé đoán CAT, DOG, DUCK… bằng tiếng Anh.",
  },
  objects: {
    tip: "Dán thẻ tên tiếng Anh lên đồ vật quen thuộc (BED, DOOR, CUP). Mỗi lần dùng đồ nào thì cùng đọc tên đồ đó.",
    play: "Săn kho báu: ba mẹ nói 'Find the BALL!', bé chạy đi tìm và mang lại, rồi đổi vai.",
  },
  colors: {
    tip: "Khi mặc đồ hoặc ăn trái cây, hỏi 'What color?' và cùng trả lời bằng tiếng Anh.",
    play: "Tìm màu: ba mẹ nói 'Find something RED!', bé tìm một đồ vật màu đó trong nhà và giơ lên.",
  },
  greetings: {
    tip: "Chào nhau mỗi sáng và tối bằng 'Hello!' và 'Bye!'. Dùng 'Thanks' và 'Sorry' đúng lúc ngay trong nhà.",
    play: "Chơi cảm xúc: bé làm mặt HAPPY hoặc SAD, ba mẹ đoán và nói tên; sau đó đổi vai.",
  },
  numbers: {
    tip: "Đếm bậc cầu thang, đếm đồ chơi, đếm ngón tay bằng tiếng Anh từ 1 đến 10 — càng đếm thật càng nhớ.",
    play: "Đếm nhảy: bé nhảy bao nhiêu lần thì ba mẹ đếm to bằng tiếng Anh, rồi đổi vai.",
  },
  weather: {
    tip: "Mỗi sáng nhìn ra cửa sổ và cùng nói thời tiết hôm nay: SUN, RAIN, CLOUD, HOT, COLD.",
    play: "Chơi 'Trời thế nào?': ba mẹ làm động tác (run run = COLD, quạt quạt = HOT), bé nói từ tiếng Anh tương ứng.",
  },
  food: {
    tip: "Nói tên món ăn bằng tiếng Anh ngay trước bữa ăn: 'This is RICE. This is EGG.' Chỉ cần 1–2 món mỗi bữa.",
    play: "Chơi 'bữa tiệc': bé 'mời' búp bê hoặc gấu bông ăn và gọi tên từng món (CAKE, JUICE…).",
  },
  body: {
    tip: "Vừa hát vừa chỉ các bộ phận cơ thể: EYE, NOSE, EAR… rồi tăng dần tốc độ cho bé cười.",
    play: "Simon nói: 'Touch your NOSE!' bé chạm đúng bộ phận. Thỉnh thoảng nói sai để bé phát hiện.",
  },
  transport: {
    tip: "Khi đi đường, chỉ xe và nói tên: CAR, BUS, BIKE. Bé rất thích khi nhận ra xe trong đời thật.",
    play: "Chơi 'Xe gì đây?': ba mẹ bắt chước tiếng xe, bé đoán TRAIN, PLANE, BOAT… bằng tiếng Anh.",
  },
  fruits: {
    tip: "Khi ăn trái cây, cùng gọi tên tiếng Anh và nói vị (ngọt, chua) bằng tiếng Việt.",
    play: "Bịt mắt đoán trái cây: bé ngửi hoặc nếm rồi nói tên bằng tiếng Anh (BANANA, MANGO…).",
  },
  toys: {
    tip: "Khi chơi cùng bé, ba mẹ nói tên đồ chơi bằng tiếng Anh: 'Give me the BALLOON, please.'",
    play: "Chơi 'trao quà': bé chọn một món (GIFT, KITE, DOLL…) tặng ba mẹ và nói tên món đó.",
  },

  // ---------- Lớp Chồi ----------
  choi_school: {
    tip: "Đặt đồ dùng học tập lên bàn và nói tên: PENCIL, RULER, PAPER. Cho bé tự chọn đồ cần dùng.",
    play: "Chơi 'Cô giáo': bé đóng cô giáo (TEACHER) của búp bê và ra lệnh 'Take your PENCIL!'.",
  },
  choi_days: {
    tip: "Treo tờ lịch tuần. Mỗi tối chỉ vào 'hôm nay' và nói tên thứ bằng tiếng Anh.",
    play: "Hát các thứ trong tuần và vỗ tay theo từng thứ; đến ngày bé thích nhất thì đứng lên nhảy.",
  },
  choi_shapes: {
    tip: "Săn hình khối trong nhà: đĩa tròn là CIRCLE, khăn vuông là SQUARE… mỗi ngày tìm một hình.",
    play: "Cắt giấy các hình rồi xếp thành ngôi nhà hoặc robot; vừa xếp vừa gọi tên hình.",
  },
  choi_clothes: {
    tip: "Khi thay đồ, gọi tên từng món: SHIRT, PANTS, SOCKS, SHOES. Cho bé tự chọn bộ đồ bằng tiếng Anh.",
    play: "Thi mặc đồ nhanh: ba mẹ nói 'Put on your CAP!', bé mặc đúng món.",
  },
  choi_house: {
    tip: "Dẫn bé đi 'tham quan' nhà, chỉ từng phòng và nói tên: KITCHEN, BEDROOM, BATHROOM…",
    play: "Chơi 'Tôi đang ở đâu?': ba mẹ nói 'I am in the KITCHEN', bé chạy đến đúng phòng đó.",
  },
  choi_actions: {
    tip: "Nói động từ khi cùng làm: 'Let's WALK! Let's JUMP!' để bé gắn từ với hành động thật.",
    play: "Simon says: ba mẹ nói WALK, JUMP, SWIM, DANCE, bé làm theo. Thỉnh thoảng nói sai để bé phát hiện.",
  },
  choi_jobs: {
    tip: "Hỏi bé 'Con muốn làm nghề gì?' và nói tên nghề bằng tiếng Anh; xem phim hoặc ảnh về bác sĩ, phi công…",
    play: "Hóa trang nhanh: bé đóng DOCTOR, PILOT, ARTIST… còn ba mẹ đoán nghề.",
  },
  choi_places: {
    tip: "Khi đi chơi, nói trước nơi sẽ đến: 'We go to the PARK.' Về nhà hỏi lại bé hôm nay đã đến đâu.",
    play: "Vẽ bản đồ nhỏ có PARK, LIBRARY, BEACH… rồi cho đồ chơi 'đi chơi' theo bản đồ.",
  },
  choi_feelings: {
    tip: "Hỏi 'How do you feel?' lúc bé đang vui, mệt hay đói; cùng nói tên cảm xúc để bé biết cách diễn đạt.",
    play: "Đoán cảm xúc: bé làm mặt TIRED, ANGRY, SCARED…, ba mẹ đoán; sau đó đổi vai.",
  },
  choi_farm: {
    tip: "Xem video trang trại và bắt chước tiếng COW, PIG, HORSE… Nói tên con vật bằng tiếng Anh trước.",
    play: "Dựng 'nông trại' bằng thú nhồi bông: bé cho từng con ăn và gọi tên.",
  },
  choi_zoo: {
    tip: "Cho bé chọn con vật yêu thích rồi kể 2–3 điều về nó (to, cao, ăn gì) bằng tiếng Việt, giữ tên con vật bằng tiếng Anh.",
    play: "Chơi 'Con gì đây?': ba mẹ tả (cổ dài = GIRAFFE, có sọc = ZEBRA), bé đoán.",
  },
  choi_sea: {
    tip: "Xem phim tài liệu biển hoặc đi thủy cung; chỉ và gọi tên: SHARK, WHALE, TURTLE.",
    play: "Giờ tắm: thả đồ chơi xuống nước làm 'đại dương' và gọi tên từng con vật biển.",
  },
  choi_garden: {
    tip: "Đi dạo ở công viên hoặc vườn, cùng tìm côn trùng và hoa: BEE, ANT, FLOWER, TREE. Nhắc bé quan sát nhẹ nhàng.",
    play: "Săn hình côn trùng: ba mẹ giấu ảnh trong nhà, bé tìm thấy thì gọi tên bằng tiếng Anh.",
  },
  choi_veggies: {
    tip: "Cho bé giúp rửa rau và nói tên rau củ: CARROT, TOMATO, CORN. Bé thường ăn rau nhiều hơn khi tự tay chuẩn bị.",
    play: "Bịt mắt sờ đoán rau củ rồi nói tên bằng tiếng Anh.",
  },
  choi_table: {
    tip: "Khi dọn bàn ăn, nhờ bé: 'Bring me a SPOON, please.' để dùng từ trong tình huống thật.",
    play: "Bày bàn tiệc cho gấu bông: bé đặt BOWL, FORK, SPOON… và gọi tên từng món.",
  },

  // ---------- Lớp Lá ----------
  la_school: {
    tip: "Mỗi chiều hỏi 'What class did you have?' và để bé trả lời bằng tên môn tiếng Anh: MATH, ART, MUSIC.",
    play: "Bé 'dạy' ba mẹ một môn học trong 2 phút, dùng càng nhiều từ tiếng Anh càng tốt.",
  },
  la_hobbies: {
    tip: "Hỏi 'What do you like?' và khuyến khích bé trả lời cả câu: 'I like DRAWING.'",
    play: "Đố mime: bé diễn tả sở thích không lời, ba mẹ đoán bằng tiếng Anh.",
  },
  la_time: {
    tip: "Dùng đồng hồ và lịch: nói 'It is MORNING' hoặc 'It is EVENING' khi sinh hoạt, và 'See you TOMORROW!' khi tạm biệt.",
    play: "Làm 'thời gian biểu một ngày' bằng hình dán: bé xếp từ MORNING đến NIGHT và đọc to.",
  },
  la_shopping: {
    tip: "Cho bé đóng vai người mua và người bán với tiền chơi; dạy câu 'How much is it?'",
    play: "Mở 'cửa hàng' ở nhà: bé là người bán (STORE), nói PRICE và nhận COIN.",
  },
  la_health: {
    tip: "Khi bé ốm nhẹ, nói bằng tiếng Anh đơn giản: 'You need REST. Take MEDICINE.' để từ vựng có ý nghĩa thật.",
    play: "Đóng vai bác sĩ: bé khám cho gấu bông và 'kê đơn' EXERCISE, REST.",
  },
  la_seasons: {
    tip: "Mỗi tháng nhìn trời cùng bé và nói mùa, thời tiết: 'It is SUNNY. It is SUMMER.'",
    play: "Vẽ 4 bức tranh bốn mùa; bé viết nhãn SPRING, SUMMER, AUTUMN, WINTER.",
  },
  la_town: {
    tip: "Khi đi trên phố, cùng nhận ra nơi chốn: BANK, HOTEL, CINEMA và hỏi 'What is this?'",
    play: "Dựng thành phố bằng hộp giấy: xếp BRIDGE, STREET, STADIUM… rồi cho xe đồ chơi chạy qua.",
  },
  la_sports: {
    tip: "Xem thể thao cùng bé và gọi tên môn; chọn một môn để cả nhà chơi vào cuối tuần.",
    play: "Thi mime thể thao: BASKETBALL, TENNIS, BADMINTON… ba mẹ đoán bằng tiếng Anh.",
  },
  la_meals: {
    tip: "Hỏi 'What do you want for LUNCH?' và để bé chọn món bằng tiếng Anh.",
    play: "Làm thực đơn: bé vẽ và viết tên món (PIZZA, SALAD, COOKIE) rồi 'gọi món' như ở nhà hàng.",
  },
  la_tech: {
    tip: "Nói tên thiết bị khi dùng cùng bé (COMPUTER, PHONE, CAMERA) và nhớ đặt giới hạn thời gian màn hình.",
    play: "Đố vui 'đoán đồ': ba mẹ tả công dụng (nghe nhạc = HEADPHONES), bé đoán tên.",
  },
  la_festivals: {
    tip: "Trước mỗi dịp lễ (Trung thu, sinh nhật, Tết), cùng nói tên đồ vật: LANTERN, CANDLE, MOONCAKE, ENVELOPE.",
    play: "Làm đèn lồng hoặc thiệp sinh nhật cùng bé và viết 2 câu chúc bằng tiếng Anh.",
  },
};
