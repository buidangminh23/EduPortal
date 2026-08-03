/**
 * What the counsellor actually says, per topic.
 *
 * Each topic holds several variants rather than one fixed paragraph. The brain
 * tracks which ids a session has already used, so a student who says "em vẫn lo
 * lắm" three times gets three different angles instead of the same block of
 * breathing exercises pasted back at them — the single biggest tell that they
 * are talking to a script.
 *
 * Every variant ends with a question. A counselling turn that closes the loop
 * ends the conversation; one that opens a door keeps the student talking, which
 * is the only way anything useful surfaces.
 */

import { TOPICS } from './topicClassifier';

const listOr = (items, fallback) => (items && items.length > 0 ? items.join(', ') : fallback);

export const TOPIC_RESPONSES = {
  [TOPICS.EXAM_ANXIETY]: [
    {
      id: 'anxiety-normalise',
      build: (ctx) => [
        `💙 Cảm ơn ${ctx.name} đã nói ra. Lo trước kỳ thi không phải là dấu hiệu em yếu — nó là cách cơ thể huy động năng lượng cho việc em coi là quan trọng.`,
        '🧘 **Ba kỹ thuật hạ nhịp trong 2 phút:**\n• **Thở 4–7–8:** hít vào 4 giây → giữ 7 giây → thở ra 8 giây, lặp 3 vòng. Thở ra dài hơn hít vào là tín hiệu "an toàn" gửi tới hệ thần kinh.\n• **Neo 5-4-3-2-1:** kể tên 5 thứ em nhìn thấy, 4 âm thanh, 3 thứ chạm được, 2 mùi, 1 vị. Kéo tâm trí ra khỏi kịch bản tương lai.\n• **Hộp lo lắng:** viết nỗi lo ra giấy, gấp lại, hẹn 19h tối mở ra nghĩ tiếp. Não chịu buông khi biết mình sẽ được quay lại.',
        'Điều em lo nhất lúc này là **trượt một môn cụ thể**, **làm bố mẹ thất vọng**, hay **một chuyện khác** ngoài thi cử?'
      ].join('\n\n'),
      quickReplies: ['Em sợ trượt môn Toán', 'Em sợ bố mẹ thất vọng', 'Em lo cả hai thứ']
    },
    {
      id: 'anxiety-reframe',
      build: (ctx) => [
        `🌬️ Thầy nghe rồi. Lần này thầy muốn thử với em một góc khác, ${ctx.name} nhé.`,
        '🎯 **Tách "điều em sợ" khỏi "điều em kiểm soát được":**\nViết hai cột. Cột trái: những thứ em không quyết được (đề khó hay dễ, bạn khác học giỏi thế nào, điểm chuẩn năm nay). Cột phải: những thứ nằm trong tay em (số buổi luyện đề, giờ đi ngủ, một dạng bài em sẽ chinh phục tuần này).',
        'Lo lắng gần như luôn sống ở cột trái. Mỗi phút em kéo sự chú ý sang cột phải là một phút em lấy lại quyền điều khiển.',
        `${ctx.gpaLine}`,
        'Nếu chỉ được chọn **một việc trong cột phải** để làm tối nay, em chọn việc gì?'
      ].join('\n\n'),
      quickReplies: ['Luyện một dạng bài Toán', 'Đi ngủ sớm hơn', 'Em chưa biết chọn gì']
    },
    {
      id: 'anxiety-body',
      build: () => [
        '💙 Khi lo lắng lặp lại nhiều ngày, cơ thể mới là nơi cần được xử lý trước tâm trí.',
        '⚡ **Ba việc thân thể trước, suy nghĩ sau:**\n• Đi bộ nhanh 10 phút ngoài trời — đốt bớt cortisol đang tồn trong máu.\n• Uống đủ nước: mất nước nhẹ đã đủ làm tim đập nhanh và bị hiểu nhầm thành "đang hoảng".\n• Cắt caffeine sau 14h trong tuần thi — cà phê và trà sữa kéo dài cảm giác bồn chồn tới tận đêm.',
        '📌 Và một quy tắc thầy muốn em nhớ: **lo lắng không tự tan lúc em nằm nghĩ về nó**. Nó tan khi em bắt tay vào một việc rất nhỏ.',
        'Em có đang gặp triệu chứng cơ thể nào không — tim đập nhanh, khó thở, đau bụng trước giờ kiểm tra?'
      ].join('\n\n'),
      quickReplies: ['Có, tim em đập rất nhanh', 'Em hay đau bụng trước giờ thi', 'Không, chỉ là suy nghĩ thôi']
    }
  ],

  [TOPICS.BURNOUT]: [
    {
      id: 'burnout-recovery',
      build: (ctx) => [
        `😴 Kiệt sức là **tín hiệu cần nạp lại**, không phải bằng chứng em lười, ${ctx.name} ạ.`,
        '⚡ **Giao thức phục hồi 72 giờ:**\n• Ngủ **7–8 tiếng**, cố định giờ đi ngủ trước **23h** — ký ức được củng cố trong giấc ngủ sâu nửa đầu đêm, học thêm 1 tiếng mà mất 1 tiếng ngủ là lỗ.\n• Chu kỳ **50 phút học – 10 phút nghỉ**, và nghỉ thật: rời bàn, không lướt điện thoại (não không hồi phục khi vẫn đang nạp thông tin).\n• Một bữa có protein mỗi ngày (trứng, sữa, thịt nạc, đậu) và đủ nước.\n• Giữ **một buổi trống hoàn toàn** trong tuần. Không phải phần thưởng — là phần của kế hoạch.',
        `${ctx.gpaLine}`,
        'Trong 7 ngày qua, đêm nào em ngủ ít nhất và vì sao?'
      ].join('\n\n'),
      quickReplies: ['Em thức khuya học bài', 'Em ngủ được nhưng vẫn mệt', 'Em muốn lập lại thời gian biểu']
    },
    {
      id: 'burnout-load',
      build: () => [
        '🪫 Nếu nghỉ rồi mà vẫn mệt, thường không phải thiếu ngủ — mà là **tải quá lớn kéo dài quá lâu**.',
        '📉 **Cắt tải trước, tăng sức sau:**\n1. Liệt kê mọi thứ đang chiếm thời gian của em trong tuần (học chính, học thêm, CLB, việc nhà, mạng xã hội).\n2. Đánh dấu 1 việc **có thể tạm dừng 2 tuần** mà không đổ vỡ gì.\n3. Dừng đúng việc đó. Không thay bằng việc khác.',
        'Cơ thể không thể phục hồi khi tổng tải vẫn giữ nguyên. Nghỉ ngơi chỉ hiệu quả khi có chỗ trống thật sự để nghỉ.',
        'Nếu buộc phải bỏ bớt **một** hoạt động trong hai tuần tới, em nghĩ tới việc nào đầu tiên?'
      ].join('\n\n'),
      quickReplies: ['Em học thêm quá nhiều', 'Em không bỏ được cái nào', 'Em dùng điện thoại quá nhiều']
    }
  ],

  [TOPICS.LOW_MOOD]: [
    {
      id: 'mood-validate',
      build: (ctx) => [
        `🤗 ${ctx.name} ơi, cảm xúc của em là hợp lệ. Buồn không phải lỗi và cũng không cần lý do "đủ lớn" mới được phép buồn.`,
        '💜 **Ba việc nhỏ có bằng chứng khoa học:**\n• Ghi **3 điều biết ơn** mỗi tối — hiệu quả không nằm ở tờ giấy mà ở việc em tập cho não chú ý tới thứ khác.\n• Nói với **một người** em tin. Nỗi buồn giữ trong đầu thì to hơn nỗi buồn nói thành lời.\n• Vận động 20 phút. Không phải để "vui lên", mà để cắt vòng lặp suy nghĩ.',
        'Điều gì khiến em thấy nặng nhất lúc này? Thầy không vội đâu, em cứ kể theo cách của em.'
      ].join('\n\n'),
      quickReplies: ['Em cũng không rõ vì sao', 'Chuyện ở lớp', 'Chuyện ở nhà']
    },
    {
      id: 'mood-exception',
      build: () => [
        '💙 Thầy muốn hỏi em một câu hơi khác thường.',
        '🔎 **Trong tuần vừa rồi, có lúc nào em thấy đỡ hơn một chút không** — dù chỉ nửa tiếng? Lúc đó em đang ở đâu, làm gì, với ai?',
        'Thầy hỏi vậy vì những "ngoại lệ" đó thường chứa manh mối rõ hơn cả việc phân tích mãi nguyên nhân nỗi buồn: chúng cho biết điều gì đang thật sự nâng em lên.',
        'Nếu tìm được một khoảnh khắc như thế, em kể thầy nghe nhé.'
      ].join('\n\n'),
      quickReplies: ['Lúc đi chơi với bạn', 'Lúc em nghe nhạc', 'Em không nhớ có lúc nào']
    }
  ],

  [TOPICS.MOTIVATION]: [
    {
      id: 'motivation-science',
      build: () => [
        '🔥 Mất động lực là chuyện phổ biến sau giai đoạn căng dài — và nó **không** được chữa bằng việc tự trách.',
        '✨ **Động lực cần ba chân:** *Tự chủ* (em được chọn cách học) · *Thành thạo* (em thấy mình khá lên) · *Ý nghĩa* (em biết mình học để làm gì). Mất động lực thường là một trong ba chân bị gãy.',
        '🎯 **Thử ngay hôm nay:** đặt đồng hồ **10 phút** — chỉ 10 phút, không cam kết gì thêm. Bắt đầu là phần khó nhất; sau khi bắt, não thường tự muốn đi tiếp.',
        '💬 *Hành động thường đến trước cảm hứng, không phải ngược lại.*',
        'Theo em, chân nào đang gãy: em không được chọn cách học, không thấy mình tiến bộ, hay chưa rõ học để làm gì?'
      ].join('\n\n'),
      quickReplies: ['Em không thấy mình tiến bộ', 'Em không biết học để làm gì', 'Em bị ép học theo cách của người khác']
    },
    {
      id: 'motivation-purpose',
      build: (ctx) => [
        `🧭 Khi câu hỏi là "học để làm gì", câu trả lời hiếm khi nằm trong sách vở — nó nằm ở hình dung về chính em vài năm tới.`,
        ctx.hasProfile
          ? `📌 Kết quả RIASEC của em đang nghiêng về **${ctx.topTraitName}**. Điều đó gợi ý: những việc như *${ctx.sampleJobs}* nhiều khả năng khiến em thấy có ý nghĩa hơn là học đều tất cả để tránh bị chê.`
          : '📌 Em chưa hoàn thành bài khảo sát RIASEC bên trái. Làm xong (khoảng 3 phút) thầy sẽ nói cụ thể hơn nhiều, vì lúc đó thầy biết em hợp hướng nào.',
        '🎯 **Bài tập 5 phút:** viết một câu bắt đầu bằng *"Em muốn trở thành người có thể..."*. Không cần đúng ngành, chỉ cần đúng cảm giác. Dán nó chỗ em hay ngồi học.',
        'Em thử viết câu đó ngay đây cho thầy xem nhé?'
      ].join('\n\n'),
      quickReplies: ['Em muốn làm bài khảo sát RIASEC', 'Em muốn thử viết câu đó', 'Em chưa nghĩ ra gì cả']
    }
  ],

  [TOPICS.FOCUS]: [
    {
      id: 'focus-friction',
      build: () => [
        '🎯 Mất tập trung phần lớn là **vấn đề môi trường**, không phải vấn đề ý chí. Ý chí thua điện thoại gần như mọi lần.',
        '🧱 **Tăng ma sát cho thứ gây xao nhãng, giảm ma sát cho việc cần làm:**\n• Điện thoại để **ở phòng khác**, không phải úp xuống bàn — khoảng cách vật lý mới có tác dụng.\n• Chuẩn bị sẵn sách vở mở đúng trang từ tối hôm trước.\n• Một tab, một cuốn vở, một việc. Đóng hết phần còn lại.',
        '⏱️ **Luật 2 phút:** thấy ngại bắt đầu thì cam kết đúng 2 phút. Hết 2 phút được phép dừng — nhưng thường thì em sẽ không dừng.',
        'Cụ thể thì thứ gì hay kéo em ra khỏi bàn học nhất: điện thoại, tiếng ồn, hay suy nghĩ lan man?'
      ].join('\n\n'),
      quickReplies: ['Điện thoại ạ', 'Em hay nghĩ lan man', 'Nhà em ồn quá']
    },
    {
      id: 'focus-procrastination',
      build: () => [
        '🌀 Trì hoãn hiếm khi là lười. Nó thường là cách né một **cảm giác khó chịu** gắn với việc đó: sợ làm sai, thấy đề quá lớn, hoặc không biết bắt đầu từ đâu.',
        '🔨 **Chẻ nhỏ tới mức không thể từ chối:**\nThay vì "ôn chương 3", viết ra "mở vở, chép lại 1 công thức, làm câu 1". Nhiệm vụ nhỏ tới mức nghe hơi buồn cười là kích cỡ đúng.',
        '📅 Và ghép nó vào một mốc sẵn có: *"Sau khi ăn tối xong, em ngồi vào bàn làm câu 1"* — mốc thời gian mơ hồ là nơi kế hoạch đi chết.',
        'Việc em đang trì hoãn lâu nhất bây giờ là việc gì? Thầy giúp em chẻ nhỏ nó.'
      ].join('\n\n'),
      quickReplies: ['Bài tập Toán', 'Ôn Văn', 'Đăng ký nguyện vọng']
    }
  ],

  [TOPICS.CAREER]: [
    {
      id: 'career-profile',
      build: (ctx) => (ctx.hasProfile ? ctx.careerBlock : ctx.careerPrompt),
      quickReplies: ['Ngành này thi khối nào?', 'Điểm của em có đủ không?', 'Em muốn xem trường phù hợp']
    },
    {
      id: 'career-doubt',
      build: (ctx) => [
        '🧭 Nếu em đang phân vân giữa vài hướng, đó là dấu hiệu tốt — nó có nghĩa em đang cân nhắc nghiêm túc chứ không chọn bừa.',
        '🔍 **Ba câu hỏi tách hướng nhanh hơn mọi bài trắc nghiệm:**\n1. Việc gì em làm mà **quên mất thời gian**?\n2. Người khác hay **nhờ em** giúp việc gì?\n3. Kiểu mệt nào em **chịu được**: mệt vì nghĩ nhiều, mệt vì nói chuyện với người, hay mệt vì làm tay chân?',
        ctx.hasProfile
          ? `📊 Đối chiếu với kết quả RIASEC (${ctx.hollandCode}), câu trả lời của em sẽ cho biết bài test đang đúng hay còn thiếu điều gì.`
          : '📊 Trả lời xong ba câu này, em làm bài khảo sát RIASEC bên trái để đối chiếu nhé.',
        'Em thử trả lời câu số 1 trước xem sao?'
      ].join('\n\n'),
      quickReplies: ['Em quên thời gian khi chơi game/thiết kế', 'Bạn hay nhờ em giảng bài', 'Em thích tự tay làm đồ']
    }
  ],

  [TOPICS.STUDY_PLAN]: [
    {
      id: 'study-plan-core',
      build: (ctx) => [
        `📚 **Kế hoạch ôn cho ${ctx.name}:**`,
        `Theo học bạ, môn cần ưu tiên của em là **${ctx.weakSubjectText}**${ctx.strongSubjectText}.`,
        '⏰ **Khung giờ tham khảo (theo nhịp sinh học):**\n• 06:00–07:00 · ôn nhanh bài cũ, không nạp bài mới\n• 08:00–11:30 · phần khó nhất trong ngày (não tỉnh nhất buổi sáng)\n• 14:00–17:00 · luyện đề, chấm và soi lỗi sai\n• 19:00–21:30 · hệ thống lại kiến thức, học nhẹ\n• Sau 22:00 · dừng, không nạp thêm',
        '🧠 **Ba kỹ thuật hiệu quả nhất theo nghiên cứu:**\n• **Active recall** — gấp vở lại, tự nhớ, rồi mới mở kiểm tra. Đọc lại nhiều lần là cách học kém hiệu quả nhất mà lại cho cảm giác an tâm nhất.\n• **Spaced repetition** — ôn lại sau 1 ngày → 3 ngày → 1 tuần → 1 tháng.\n• **Feynman** — giảng lại bằng lời của em cho một người không biết gì. Chỗ nào lắp bắp là chỗ chưa hiểu.',
        `Em muốn thầy đi sâu vào môn nào trước — ${ctx.firstWeakSubject}?`
      ].join('\n\n'),
      quickReplies: ['Toán ạ', 'Ngữ văn ạ', 'Em muốn kế hoạch theo tuần']
    },
    {
      id: 'study-plan-errors',
      build: () => [
        '📈 Đến giai đoạn này, điểm không tăng nhờ học thêm giờ — mà nhờ **sửa đúng lỗi sai**.',
        '📓 **Sổ lỗi sai (bắt buộc, không phải tuỳ chọn):**\nMỗi câu làm sai ghi 3 dòng: *(1) đề — (2) mình đã nghĩ sai chỗ nào — (3) dấu hiệu nhận biết dạng này lần sau.*\nĐiều quan trọng là dòng 2. Chép lại lời giải đúng mà bỏ qua dòng 2 thì tuần sau sẽ sai lại y hệt.',
        '🔁 **Chu kỳ:** làm đề → chấm → phân loại lỗi (*không biết kiến thức / biết nhưng nhầm / cẩu thả*) → luyện đúng loại lỗi chiếm nhiều nhất. Ba loại này cần ba cách chữa hoàn toàn khác nhau.',
        'Em thử nhớ lại bài kiểm tra gần nhất: lỗi của em rơi vào loại nào nhiều nhất?'
      ].join('\n\n'),
      quickReplies: ['Em cẩu thả nhiều', 'Em hổng kiến thức', 'Em biết nhưng làm không kịp giờ']
    }
  ],

  [TOPICS.TIME_MANAGEMENT]: [
    {
      id: 'time-audit',
      build: () => [
        '⏳ Trước khi sắp lại lịch, cần biết thời gian đang **thật sự** đi đâu — bản ước lượng trong đầu luôn lệch.',
        '📋 **Ghi nhật ký 3 ngày:** cứ 2 tiếng ghi một dòng em vừa làm gì. Ba ngày là đủ để lộ ra "khoảng trống đen" — thường là 1–2 tiếng buổi tối bốc hơi mà không nhớ đã làm gì.',
        '🧮 **Rồi mới xếp lịch theo thứ tự này:** giấc ngủ (cố định trước) → 2 khối học sâu → việc cố định (học thêm, việc nhà) → phần còn lại là thời gian tự do, và **giữ nguyên nó**.',
        'Buổi nào trong ngày em hay bị "bốc hơi" thời gian nhất?'
      ].join('\n\n'),
      quickReplies: ['Buổi tối ạ', 'Sau giờ tan học', 'Cuối tuần em mất cả ngày']
    }
  ],

  [TOPICS.RELATIONSHIP]: [
    {
      id: 'relationship-tools',
      build: () => [
        '👥 Chuyện với bạn bè ảnh hưởng tới việc học nhiều hơn hầu hết mọi người thừa nhận — em để tâm tới nó là đúng.',
        '💬 **Vài công cụ dùng được ngay:**\n• **Thông điệp "Tôi"**: thay vì *"Cậu làm tớ bực"* → *"Tớ thấy buồn khi chuyện đó xảy ra"*. Câu thứ hai khó bị phản đòn hơn nhiều.\n• Mâu thuẫn là **bình thường**; điều tạo khác biệt là cách xử lý, không phải việc tránh được hay không.\n• Em **không có nghĩa vụ** làm hài lòng tất cả. Đó là con đường ngắn nhất tới kiệt sức.',
        '🛡️ Nếu là **bắt nạt, tẩy chay hoặc bị doạ** — đó không còn là mâu thuẫn bạn bè nữa. Em có quyền được nhà trường bảo vệ, và thầy khuyến khích em báo với giáo viên chủ nhiệm hoặc phòng tham vấn.',
        'Chuyện của em đang ở mức nào: hiểu lầm nhất thời, xa cách dần, hay em đang bị đối xử tệ?'
      ].join('\n\n'),
      quickReplies: ['Chỉ là hiểu lầm thôi', 'Em thấy mình bị xa lánh', 'Em bị nói xấu/tẩy chay']
    }
  ],

  [TOPICS.FAMILY]: [
    {
      id: 'family-expectation',
      build: (ctx) => [
        `🏠 Áp lực từ gia đình khó hơn áp lực thi cử, vì em không thể "nộp bài rồi thôi" — em sống cùng nó mỗi ngày.`,
        '🕊️ **Vài điều thầy quan sát được:**\n• Phần lớn kỳ vọng của bố mẹ xuất phát từ lo lắng, không phải chê bai — nhưng nói ra thì thành câu so sánh, và em là người hứng.\n• Câu mở đầu hiệu quả hơn tranh luận: *"Bố mẹ ơi, con muốn kể bố mẹ nghe con đang cố gắng thế nào"* — kể quá trình, đừng chỉ bảo vệ kết quả.\n• Chọn lúc nói: không phải ngay sau khi có điểm, không phải lúc mọi người đang mệt.',
        ctx.hasProfile
          ? `📊 Nếu xung đột là chuyện chọn ngành, kết quả RIASEC (**${ctx.hollandCode}**) là thứ cụ thể để đưa ra nói chuyện — có dữ liệu thì cuộc trò chuyện bớt cảm tính hơn nhiều.`
          : '📊 Nếu xung đột là chuyện chọn ngành, em làm bài khảo sát RIASEC bên trái rồi in kết quả ra cho bố mẹ xem — nói chuyện có dữ liệu dễ hơn nói chuyện bằng cảm xúc.',
        'Điều bố mẹ đang mong ở em cụ thể là gì, và phần nào trong đó khiến em thấy khó nhất?'
      ].join('\n\n'),
      quickReplies: ['Bố mẹ muốn em chọn ngành khác', 'Bố mẹ so sánh em với người khác', 'Bố mẹ đặt mục tiêu điểm quá cao']
    }
  ],

  [TOPICS.SELF_ESTEEM]: [
    {
      id: 'esteem-comparison',
      build: (ctx) => [
        `🪞 So sánh là phản xạ tự nhiên, nhưng em đang so **hậu trường của mình với sân khấu của người khác** — em biết mọi lần mình chật vật, còn của họ thì chỉ thấy kết quả.`,
        '📏 **Đổi thước đo:** so với chính em ba tháng trước, không phải với bạn giỏi nhất lớp. Đó là thước duy nhất phản ánh nỗ lực của em.',
        ctx.gpaLine,
        '🧠 Và một mẹo nhỏ: khi bắt gặp ý nghĩ *"mình kém"*, thử viết lại thành *"mình chưa làm được **việc này** — chưa phải là mình kém"*. Thu hẹp phán xét về đúng phạm vi của nó.',
        'Em đang so sánh mình với ai, và ở chuyện gì cụ thể?'
      ].join('\n\n'),
      quickReplies: ['Với bạn cùng lớp', 'Với anh chị em trong nhà', 'Với hình mẫu trên mạng']
    }
  ],

  [TOPICS.HEALTH]: [
    {
      id: 'health-basics',
      build: () => [
        '🌙 Sức khoẻ là nền của việc học — thầy rất mừng vì em để ý tới nó.',
        '🏃 **Bốn con số đáng nhớ:**\n• **Ngủ 7–9 tiếng**, cố định giờ dậy kể cả cuối tuần (giờ dậy quan trọng hơn giờ ngủ).\n• **Ăn sáng có protein** — bỏ bữa sáng làm khả năng tập trung buổi học đầu giảm rõ rệt.\n• **Vận động 20–30 phút/ngày** — tăng BDNF, chất giúp não tạo kết nối mới. Đây là "thuốc bổ não" rẻ nhất.\n• **1,5–2 lít nước/ngày** — thiếu nước nhẹ đã đủ làm giảm khả năng chú ý.',
        '🚫 **Ba thứ nên cắt trong mùa thi:** caffeine sau 14h, màn hình 1 tiếng trước ngủ, ăn no sát giờ đi ngủ.',
        'Trong bốn con số trên, cái nào em đang xa nhất?'
      ].join('\n\n'),
      quickReplies: ['Giấc ngủ ạ', 'Em hay bỏ bữa sáng', 'Em không vận động gì cả']
    }
  ],

  [TOPICS.GREETING]: [
    {
      id: 'greeting',
      build: (ctx) => [
        `👋 Chào ${ctx.name}! Thầy đây.`,
        'Em muốn bắt đầu từ đâu?\n• 😰 Căng thẳng, lo lắng thi cử\n• 🎯 Chọn ngành, chọn trường\n• 📚 Cách học và kế hoạch ôn\n• 💬 Chuyện bạn bè, gia đình\n• 😴 Mệt mỏi, mất ngủ, mất động lực',
        'Hoặc em cứ kể chuyện đang xảy ra, thầy nghe.'
      ].join('\n\n'),
      quickReplies: ['Em đang lo thi cử', 'Em muốn chọn ngành', 'Em thấy mệt mỏi']
    }
  ],

  [TOPICS.THANKS]: [
    {
      id: 'thanks',
      build: (ctx) => [
        `😊 Thầy vui vì được đồng hành cùng em, ${ctx.name}.`,
        ctx.recapLine,
        '💙 Ba điều thầy muốn em giữ lại:\n• Nghỉ ngơi là **đầu tư**, không phải lãng phí.\n• Hỏi khi cần — không ai đi xa một mình được.\n• Tiến bộ 1% mỗi ngày quan trọng hơn một hôm bùng lên rồi tắt.',
        'Em quay lại đây bất cứ lúc nào nhé. Thầy luôn ở đây. 💙'
      ].filter(Boolean).join('\n\n'),
      quickReplies: ['Em muốn hỏi thêm một chuyện', 'Em muốn đặt lịch gặp thầy cô', 'Cảm ơn thầy ạ']
    }
  ]
};

/**
 * Openers used when nothing matched.
 *
 * These are real counselling moves — reflecting, scaling, looking for
 * exceptions — rather than three rephrasings of "kể thêm đi". They rotate, so a
 * student who keeps typing something the classifier cannot place still gets a
 * conversation that goes somewhere.
 */
export const GENERAL_PROBES = [
  {
    id: 'probe-scaling',
    build: (ctx) => [
      `💙 Thầy đang nghe em, ${ctx.name}.`,
      '📊 Cho thầy hỏi một câu để hình dung rõ hơn: **trên thang 1–10, hôm nay em thấy mình ở mức nào** (1 là rất tệ, 10 là rất ổn)?',
      'Và điều gì khiến em không chọn số thấp hơn một bậc? Câu đó thường cho thấy em đang có sẵn chỗ dựa nào mà chính em chưa để ý.'
    ].join('\n\n'),
    quickReplies: ['Khoảng 3/10', 'Khoảng 5/10', 'Khoảng 7/10']
  },
  {
    id: 'probe-specific',
    build: () => [
      '🤝 Cảm ơn em đã chia sẻ. Để thầy hỗ trợ đúng chỗ, em kể cụ thể hơn giúp thầy nhé:',
      '• Chuyện này bắt đầu từ khi nào?\n• Em đã thử cách nào rồi?\n• Điều em mong nhất lúc này là gì?',
      'Trả lời được câu nào thì trả lời câu đó, không cần đủ cả ba đâu.'
    ].join('\n\n'),
    quickReplies: ['Mới gần đây thôi', 'Kéo dài lâu rồi ạ', 'Em chưa thử cách nào cả']
  },
  {
    id: 'probe-impact',
    build: () => [
      '✨ Thầy hiểu. Có một câu thầy muốn hỏi thêm:',
      '**Chuyện này đang ảnh hưởng tới phần nào trong ngày của em nhiều nhất** — lúc học, lúc ở lớp, hay lúc về nhà một mình?',
      'Biết được nó "đậu" ở đâu thì mình sẽ biết nên bắt đầu gỡ từ đâu.'
    ].join('\n\n'),
    quickReplies: ['Lúc ngồi vào bàn học', 'Lúc ở lớp', 'Lúc ở nhà buổi tối']
  }
];

/** Prefix acknowledging the mood chip the student tapped. */
export const MOOD_OPENERS = {
  great: '😄 Thầy vui khi biết hôm nay là một ngày tốt của em!',
  okay: '🙂 Cảm ơn em đã chia sẻ tâm trạng hôm nay với thầy.',
  stressed: '😰 Thầy ghi nhận là hôm nay em đang căng. Mình đi từ từ nhé.',
  sad: '😢 Thầy biết hôm nay em đang buồn. Cảm ơn em vì vẫn mở lời.',
  tired: '😴 Hôm nay em mệt — thầy sẽ nói ngắn gọn thôi.'
};

/** Fallback career copy when the survey has not been taken yet. */
export function buildCareerPrompt(ctx) {
  return [
    `🧭 Thầy rất muốn tư vấn hướng nghiệp cho ${ctx.name} một cách cụ thể chứ không nói chung chung.`,
    '📋 Muốn vậy thầy cần dữ liệu: em làm giúp thầy **bài khảo sát RIASEC ở khung bên trái** nhé — 24 câu, khoảng 3 phút.',
    'Xong bài đó thầy sẽ nói được: nhóm ngành hợp gu em, khối thi nên tập trung, và các trường nên nhắm — dựa trên chính câu trả lời của em chứ không phải phỏng đoán.',
    `${ctx.gpaLine}`,
    'Trong lúc chờ, em cho thầy biết: hiện em đang phân vân giữa những hướng nào?'
  ].join('\n\n');
}

/** Full personalised career answer once a profile exists. */
export function buildCareerBlock(ctx) {
  const { profile, guidance } = ctx;
  const [top1, top2] = profile.ranked;

  return [
    `🧭 **Phân tích hướng nghiệp cho ${ctx.name}**`,
    `Mã Holland của em: **${profile.hollandCode}** — dẫn đầu là ${top1.emoji} **${top1.name}** (${top1.percent}%), sau đó là ${top2.emoji} **${top2.name}** (${top2.percent}%). Độ tin cậy của kết quả: **${profile.confidence}%** · ${profile.consistency.label}.`,
    `🎓 **Nhóm ngành nên nhắm:** ${listOr(guidance.majors, 'đang cập nhật')}`,
    `💼 **Nghề nghiệp tương ứng:** ${listOr(guidance.jobs, 'đa dạng')}`,
    `📚 **Khối thi phù hợp:** ${listOr(guidance.blocks, 'chưa xác định')}`,
    guidance.unis?.length ? `🏫 **Trường tham khảo:** ${guidance.unis.join(' · ')}` : null,
    guidance.alsoConsider?.length ? `➕ **Có thể cân nhắc thêm:** ${guidance.alsoConsider.join(', ')}` : null,
    ctx.gpaLine,
    guidance.caveat ? `⚠️ ${guidance.caveat}` : profile.consistency.note,
    'Em muốn thầy đi sâu vào ngành nào trong số này, hay muốn xem danh sách trường theo mức điểm?'
  ].filter(Boolean).join('\n\n');
}
