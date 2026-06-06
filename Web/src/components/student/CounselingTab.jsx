import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Compass, Heart, Send } from 'lucide-react';

const getTimestamp = () => Date.now();

export default function CounselingTab({ student }) {
  const { careerTestScores, saveCareerTest } = useContext(AppContext);
  const [riasecAnswers, setRiasecAnswers] = useState({ R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 });
  const [counselorInput, setCounselorInput] = useState('');
  const [counselorIsTyping, setCounselorIsTyping] = useState(false);
  const [counselorMood, setCounselorMood] = useState(null);
  const [counselorMsgCount, setCounselorMsgCount] = useState(0);
  const [hasCompletedRiasec, setHasCompletedRiasec] = useState(() => {
    return careerTestScores ? careerTestScores.some(s => s.studentId === student?.id) : false;
  });

  const [counselorHistory, setCounselorHistory] = useState(() => [
    { sender: 'counselor', text: '👋 Chào em! Thầy là chuyên gia tư vấn tâm lý học đường của nhà trường.\n\nKỳ thi tốt nghiệp THPT sắp đến, thầy hiểu rằng đây là giai đoạn các em chịu rất nhiều áp lực. Thầy ở đây để lắng nghe và đồng hành cùng em.\n\n💬 Em có thể hỏi thầy về:\n• Căng thẳng thi cử & quản lý cảm xúc\n• Định hướng ngành nghề & kết quả RIASEC\n• Kỹ năng học tập & lập kế hoạch ôn thi\n• Các mối quan hệ & vấn đề cá nhân\n\nHôm nay em đang cảm thấy thế nào?', timestamp: getTimestamp() }
  ]);

  const handleRiasecSave = () => {
    saveCareerTest(student.id, riasecAnswers);
    setHasCompletedRiasec(true);
    alert('Đã lưu kết quả khảo sát RIASEC thành công!');
  };

  const getRiasecScores = () => {
    const contextScore = careerTestScores ? careerTestScores.find(s => s.studentId === student.id) : null;
    return contextScore || riasecAnswers;
  };

  const getRiasecText = (scores) => {
    const entries = Object.entries(scores).filter(([k]) => k !== 'studentId');
    entries.sort((a, b) => b[1] - a[1]);
    const topTrait = entries[0][0];

    switch (topTrait) {
      case 'R': return { name: 'R - Kỹ thuật (Realistic)', desc: 'Thích làm việc với máy móc, công cụ, bản vẽ kỹ thuật. Phù hợp các khối ngành Kỹ sư, Lập trình điều khiển, Robotics.', jobs: 'Kỹ sư cơ điện tử, Kỹ sư phần mềm, Kiến trúc sư, Chuyên gia tự động hóa.' };
      case 'I': return { name: 'I - Nghiên cứu (Investigative)', desc: 'Thích quan sát, tìm tòi, suy luận logic để giải quyết vấn đề toán/lý/hóa học. Thích làm việc độc lập nghiên cứu.', jobs: 'Nhà khoa học dữ liệu, Nhà nghiên cứu toán học, Lập trình viên AI, Bác sĩ học thuật.' };
      case 'A': return { name: 'A - Nghệ thuật (Artistic)', desc: 'Thích tự do sáng tạo nghệ thuật, giàu trí tưởng tượng, cảm xúc nhạy bén và kỹ năng biểu đạt cao.', jobs: 'Nhà thiết kế đồ họa, Biên kịch phim, Đạo diễn nghệ thuật, Nhà báo tự do.' };
      case 'S': return { name: 'S - Xã hội (Social)', desc: 'Thích hỗ trợ, đào tạo, giao lưu và chăm sóc những người xung quanh. Có tinh thần đồng đội cao.', jobs: 'Giảng viên sư phạm, Nhà tâm lý học, Quản trị nhân sự, Chuyên viên công tác xã hội.' };
      case 'E': return { name: 'E - Quản lý (Enterprising)', desc: 'Thích dẫn dắt đội ngũ, quản lý kế hoạch dự án, có khả năng đàm phán thuyết phục tốt và ham học hỏi.', jobs: 'Quản lý dự án start-up, Giám đốc tài chính, Chuyên viên marketing, Luật sư đàm phán.' };
      case 'C': return { name: 'C - Nghiệp vụ (Conventional)', desc: 'Thích tính toán số liệu, lập bảng kiểm soát, ngăn nắp và thực thi chính xác các quy trình kế toán.', jobs: 'Kế toán trưởng, Kiểm toán viên nhà nước, Chuyên viên thống kê thuế, Quản trị cơ sở dữ liệu.' };
      default: return { name: 'Hài hòa', desc: 'Sở hữu nhiều phẩm chất tính cách nghề nghiệp cân bằng.', jobs: 'Nhiều lĩnh vực đa dạng.' };
    }
  };

  const currentScores = getRiasecScores();
  const riasecInfo = getRiasecText(currentScores);

  const getRadarPointsPath = (scores) => {
    const center = 150;
    const maxVal = 5;
    const radarRadius = 100;
    const axes = [
      { k: 'R', angle: 0 },
      { k: 'I', angle: Math.PI / 3 },
      { k: 'A', angle: (2 * Math.PI) / 3 },
      { k: 'S', angle: Math.PI },
      { k: 'E', angle: (4 * Math.PI) / 3 },
      { k: 'C', angle: (5 * Math.PI) / 3 }
    ];

    const points = axes.map(axis => {
      const score = scores[axis.k] || 3;
      const length = (score / maxVal) * radarRadius;
      const x = center + length * Math.sin(axis.angle);
      const y = center - length * Math.cos(axis.angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  const generateCounselorReply = (txt, msgCount, mood, studentInfo, riasecProfile) => {
    const norm = txt.toLowerCase();
    const studentName = studentInfo.name.split(' ').pop();
    const gpaVal = parseFloat((Object.values(studentInfo.grades).reduce((a, b) => a + b, 0) / Object.values(studentInfo.grades).length).toFixed(1));

    if (norm.includes('tự tử') || norm.includes('không muốn sống') || norm.includes('kết thúc tất cả') || norm.includes('chán sống')) {
      return `💙 Em ơi, thầy rất lo cho em khi nghe điều này. Em không đơn độc – thầy ở đây và nhà trường luôn bảo vệ em.\n\nXin hãy gọi ngay **Đường dây hỗ trợ sức khỏe tâm thần 1800 599 920** (miễn phí, 24/7) hoặc tìm gặp thầy cô ngay hôm nay.\n\nEm có thể kể cho thầy nghe thêm chuyện gì đang xảy ra không? Thầy lắng nghe em.`;
    }

    if (norm.includes('áp lực') || norm.includes('lo lắng') || norm.includes('lo sợ') || norm.includes('hoảng loạn') || norm.includes('panic')) {
      return `💙 Cảm ơn em đã chia sẻ. Áp lực trước kỳ thi là phản ứng hoàn toàn bình thường của não bộ – nó thực ra là bằng chứng em đang coi trọng việc học.\n\n🧘 **3 kỹ thuật giảm lo âu tức thời:**\n• **Thở 4-7-8:** Hít vào 4 giây → Nín thở 7 giây → Thở ra 8 giây. Lặp 3 lần.\n• **Kỹ thuật 5-4-3-2-1:** Nhìn 5 thứ, nghe 4 âm thanh, chạm 3 bề mặt, ngửi 2 mùi, nếm 1 vị – giúp em về hiện tại.\n• **"Hộp lo lắng":** Viết nỗi lo ra giấy, gấp lại, đặt sang một bên – não bộ sẽ "tạm đóng" vấn đề đó.\n\nEm đang lo nhất về điều gì? Thi cử, gia đình, hay một vấn đề khác?`;
    }

    if (norm.includes('mệt') || norm.includes('kiệt sức') || norm.includes('burnout') || norm.includes('không ngủ được') || norm.includes('mất ngủ')) {
      return `😴 Thầy hiểu rồi – kiệt sức học tập là tín hiệu cơ thể em cần được nạp lại năng lượng, không phải dấu hiệu của sự yếu đuối.\n\n⚡ **Giao thức phục hồi năng lượng:**\n• Ngủ đủ **7–8 tiếng**, đặc biệt quan trọng: ngủ trước **23h** vì não củng cố trí nhớ trong giấc ngủ sâu.\n• Sau mỗi **50 phút học**, nghỉ **10 phút** theo kỹ thuật Pomodoro.\n• Bổ sung protein (trứng, sữa, thịt nạc) và uống đủ nước – não cần nước để hoạt động tốt.\n• Tránh học sau **22h** – học khuya làm giảm khả năng ghi nhớ 40%.\n\n${gpaVal >= 8.5 ? `GPA của em là ${gpaVal} – rất xuất sắc! Em xứng đáng được nghỉ ngơi sau bao nỗ lực.` : `GPA của em là ${gpaVal} – hãy ôn theo thứ tự ưu tiên môn yếu trước.`}\n\nEm có muốn thầy giúp lập thời gian biểu ôn thi cân bằng không?`;
    }

    if (norm.includes('buồn') || norm.includes('khóc') || norm.includes('cô đơn') || norm.includes('không ai hiểu') || norm.includes('chán nản')) {
      return `🤗 Em ơi, cảm xúc của em hoàn toàn hợp lệ. Được phép buồn – điều đó cho thấy em đang cảm nhận cuộc sống sâu sắc.\n\nNhà tâm lý học Viktor Frankl từng nói: *"Giữa kích thích và phản ứng, có một khoảng không gian. Trong không gian đó là quyền tự do và sức mạnh của ta."*\n\n💜 **Những điều nhỏ giúp nâng tinh thần:**\n• Ghi lại **3 điều em biết ơn** mỗi tối – khoa học chứng minh giúp tái cấu trúc não bộ sau 21 ngày.\n• Nói chuyện với người bạn tin tưởng – đừng mang gánh nặng một mình.\n• Vận động 20 phút/ngày – cơ thể tiết Endorphin tự nhiên như "thuốc chống trầm cảm".\n\nEm muốn chia sẻ thêm chuyện gì đang xảy ra không? Thầy không vội đâu.`;
    }

    if (norm.includes('riasec') || norm.includes('chọn ngành') || norm.includes('hướng nghiệp') || norm.includes('nghề nghiệp') || norm.includes('đại học') || norm.includes('ngành nào') || norm.includes('tương lai')) {
      const scores = riasecProfile;
      const entries = Object.entries(scores).filter(([k]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(k));
      entries.sort((a, b) => b[1] - a[1]);
      const [top1, top2] = entries;
      const code = (top1 ? top1[0] : 'I') + (top2 ? top2[0] : 'A');
      const codeMap = {
        'RI': 'Kỹ sư AI/Robotics, Kỹ sư phần mềm nhúng',
        'IA': 'Nhà khoa học dữ liệu, Thiết kế UX/UI nghiên cứu',
        'IS': 'Bác sĩ nội khoa, Nhà tâm lý học lâm sàng',
        'AS': 'Nhà giáo dục sáng tạo, Nhà thiết kế trải nghiệm',
        'SE': 'Quản lý nhân sự, Chuyên gia phát triển cộng đồng',
        'EC': 'Giám đốc tài chính, Luật sư doanh nghiệp',
        'IR': 'Kỹ sư nghiên cứu & phát triển, Chuyên gia an ninh mạng',
        'EA': 'Đạo diễn sáng tạo, Marketing chiến lược',
      };
      const suggestion = codeMap[code] || 'Nhiều ngành nghề đa dạng phù hợp với em';
      return `🧭 **Phân tích hướng nghiệp cá nhân hóa cho ${studentName}:**\n\nDựa trên bài test RIASEC, mã nghề nghiệp nổi bật của em là **${top1 ? top1[0] : '?'}-${top2 ? top2[0] : '?'}** (điểm: ${top1 ? top1[1] : '?'}/5 và ${top2 ? top2[1] : '?'}/5).\n\n🎯 **Nghề nghiệp phù hợp gợi ý:** ${suggestion}\n\n📚 **Khối thi tham khảo:**\n• Nhóm R+I: Khối A00 (Toán-Lý-Hóa), A01 (Toán-Lý-Anh)\n• Nhóm A+S: Khối C00 (Văn-Sử-Địa), D01 (Văn-Toán-Anh)\n• Nhóm E+C: Khối D01, A01 + Năng khiếu kinh tế\n\n💡 Với GPA **${gpaVal}**, em ${gpaVal >= 9 ? 'có thể xét tuyển thẳng vào các trường TOP đầu!' : gpaVal >= 8 ? 'đang trong vùng an toàn cho các trường tốp đầu' : 'nên tập trung ôn luyện để cải thiện điểm số'}.\n\nEm muốn biết chi tiết về ngành nào trong số này?`;
    }

    if (norm.includes('học') || norm.includes('ôn thi') || norm.includes('điểm') || norm.includes('thi') || norm.includes('bài') || norm.includes('môn')) {
      const weakSubjects = Object.entries(studentInfo.grades).filter(([, v]) => v < 8).map(([k]) => k);
      const weakStr = weakSubjects.length > 0 ? weakSubjects.join(', ') : 'tất cả các môn đều khá tốt';
      return `📚 **Kế hoạch ôn tập thông minh cho ${studentName}:**\n\nDựa trên học bạ của em, điểm cần ưu tiên cải thiện: **${weakStr}**.\n\n⏰ **Thời gian biểu ôn thi hiệu quả (tham khảo):**\n• 06:00–07:00: Ôn nhanh bài cũ (không học bài mới buổi sáng)\n• 08:00–11:30: Học bài mới (não hoạt động tốt nhất buổi sáng)\n• 14:00–17:00: Làm đề luyện tập & giải bài tập\n• 19:00–21:30: Ôn tập và hệ thống kiến thức\n• 22:00: Dừng học, giải trí nhẹ → ngủ trước 23h\n\n🧠 **Kỹ thuật học siêu tốc:**\n• **Spaced Repetition**: Ôn lại sau 1 ngày, 3 ngày, 1 tuần, 1 tháng\n• **Active Recall**: Đóng vở lại, tự hỏi rồi mới mở kiểm tra\n• **Feynman Technique**: Giải thích khái niệm như dạy cho người khác\n\nEm đang gặp khó khăn nhất ở môn nào?`;
    }

    if (norm.includes('bạn bè') || norm.includes('bắt nạt') || norm.includes('cô đơn') || norm.includes('mâu thuẫn') || norm.includes('gia đình') || norm.includes('bố') || norm.includes('mẹ') || norm.includes('ba') || norm.includes('má')) {
      return `👥 Các mối quan hệ ảnh hưởng rất lớn đến tâm lý và học tập của em.\n\n💬 **Một vài điều thầy muốn chia sẻ:**\n• Xung đột là **bình thường** – điều quan trọng là cách xử lý, không phải tránh né.\n• Hãy dùng **"Thông điệp Tôi"**: thay vì "Bạn làm tôi tức" → "Tôi cảm thấy buồn khi điều đó xảy ra".\n• Nếu bị bắt nạt hoặc áp lực từ bạn bè/gia đình, em **có quyền** tìm giáo viên tư vấn để được hỗ trợ.\n• Đừng cố gắng làm hài lòng tất cả mọi người – đó là con đường dẫn đến kiệt sức.\n\nEm muốn kể cụ thể hơn về tình huống đang gặp không? Mọi thông tin em chia sẻ đều được bảo mật.`;
    }

    if (norm.includes('không muốn học') || norm.includes('chán') || norm.includes('lười') || norm.includes('vô nghĩa') || norm.includes('bỏ cuộc') || norm.includes('nản')) {
      return `🔥 Thầy hiểu – cảm giác mất động lực là rất phổ biến, đặc biệt sau những giai đoạn học căng thẳng kéo dài.\n\n✨ **Khoa học về động lực:**\nNão bộ cần 3 yếu tố để duy trì động lực: **Tự chủ** (em tự chọn cách học) + **Thành thạo** (thấy mình tiến bộ) + **Mục đích** (biết tại sao mình học).\n\n🎯 **Thực hành ngay:**\n1. Viết ra **một lý do lớn nhất** em muốn học tốt – dán nơi em hay nhìn\n2. Đặt mục tiêu nhỏ 25 phút (1 Pomodoro) – chỉ 25 phút thôi, không áp lực\n3. Thưởng bản thân sau mỗi mục tiêu nhỏ hoàn thành\n\n💬 *"Thành công không đến từ việc luôn cảm thấy có hứng – mà từ việc hành động ngay cả khi không có hứng."*\n\nEm có thể kể cho thầy nghe ước mơ lớn nhất của em không?`;
    }

    if (norm.includes('ngủ') || norm.includes('sức khỏe') || norm.includes('ăn') || norm.includes('dinh dưỡng') || norm.includes('thể dục')) {
      return `🌙 Sức khỏe là nền tảng của việc học hiệu quả. Thầy rất vui em để ý đến điều này!\n\n🏃 **Công thức sức khỏe học sinh:**\n• **Ngủ:** 7–9 tiếng/đêm, ngủ và dậy đúng giờ mỗi ngày (kể cả cuối tuần)\n• **Dinh dưỡng:** Ăn sáng đủ (đặc biệt protein + carb phức) – bỏ bữa sáng giảm 20% khả năng tập trung\n• **Vận động:** 20–30 phút/ngày (đi bộ, bơi, đạp xe) – tăng BDNF, "phân bón" cho tế bào thần kinh\n• **Nước:** Uống 1.5–2 lít nước/ngày. Thiếu nước 2% = giảm 10% khả năng nhận thức\n• **Hạn chế:** Cà phê sau 14h, màn hình trước ngủ 1 tiếng, ăn đêm sau 21h\n\nEm muốn hỏi cụ thể hơn về khía cạnh nào không?`;
    }

    if (msgCount >= 3 && (norm.includes('oke') || norm.includes('ok') || norm.includes('cảm ơn') || norm.includes('hiểu rồi') || norm.includes('thanks'))) {
      return `😊 Thầy rất vui được đồng hành cùng em, ${studentName}!\n\nNhớ rằng: hành trình 1000 dặm bắt đầu từ một bước chân. Em đã dũng cảm chia sẻ – đó là bước đầu tiên rồi.\n\n📋 **Tóm tắt các điểm thầy muốn em nhớ:**\n• Nghỉ ngơi đủ giấc là ĐẦU TƯ, không phải lãng phí thời gian\n• Hỏi thầy cô khi cần – không ai giỏi một mình\n• Mỗi ngày tiến bộ 1% – sau 1 năm sẽ giỏi hơn 37 lần\n\nEm luôn có thể quay lại đây bất cứ khi nào cần nhé! 💙`;
    }

    if (norm.includes('xin chào') || norm.includes('hello') || norm.includes('chào thầy') || norm.includes('hi') || txt.length < 15) {
      return `👋 Chào ${studentName}! Thầy rất vui được gặp em.\n\nHôm nay em muốn nói chuyện về điều gì? Thầy có thể hỗ trợ em về:\n• 😰 Căng thẳng thi cử & cảm xúc\n• 🎯 Hướng nghiệp & chọn ngành\n• 📚 Kế hoạch học tập\n• 💬 Mối quan hệ & kỹ năng sống\n\nCứ thoải mái chia sẻ với thầy nhé!`;
    }

    const fallbacks = [
      `💙 Cảm ơn em đã chia sẻ. Thầy đang lắng nghe rất chăm chú.\n\nĐể thầy có thể hỗ trợ em tốt hơn, em có thể kể thêm cụ thể hơn không? Ví dụ:\n• Chuyện này xảy ra từ bao giờ?\n• Em đã thử làm gì chưa?\n• Điều em mong muốn nhất lúc này là gì?`,
      `🤝 Thầy hiểu em. Mỗi người có hành trình riêng – không có gì là "quá nhỏ" để chia sẻ.\n\nEm có muốn nói thêm về hoàn cảnh cụ thể không? Thầy sẽ cố gắng đưa ra gợi ý phù hợp nhất cho ${studentName}.`,
      `✨ Em đã nói rất đúng. Thầy muốn hỏi thêm để hiểu rõ hơn: điều này ảnh hưởng đến việc học hoặc cuộc sống hàng ngày của em như thế nào? Cứ nói thật lòng nhé, thầy không phán xét đâu.`
    ];
    return fallbacks[msgCount % fallbacks.length];
  };

  const handleCounselorSend = (e) => {
    e.preventDefault();
    const inputVal = counselorInput.trim();
    if (!inputVal || counselorIsTyping) return;

    const userMsg = { sender: 'user', text: inputVal, timestamp: getTimestamp() };
    setCounselorHistory(prev => [...prev, userMsg]);
    setCounselorInput('');
    setCounselorIsTyping(true);
    const newCount = counselorMsgCount + 1;
    setCounselorMsgCount(newCount);

    const delay = 800 + Math.min(inputVal.length * 18, 2000);
    setTimeout(() => {
      const reply = generateCounselorReply(inputVal, newCount, counselorMood, student, currentScores);
      setCounselorHistory(prev => [...prev, { sender: 'counselor', text: reply, timestamp: getTimestamp() }]);
      setCounselorIsTyping(false);
    }, delay);
  };

  const handleCounselorQuickReply = (text) => {
    setCounselorInput(text);
  };

  return (
    <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>

      {/* RIASEC Career psychometric questionnaire */}
      <div>
        <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
          <Compass size={18} color="var(--accent-primary)" />
          <span>Khảo sát tính cách Hướng nghiệp RIASEC</span>
        </h2>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hãy chấm điểm từ 1 (Không thích) đến 5 (Rất thích) cho các nhóm câu hỏi bên dưới để khám phá thế mạnh tính cách nghề nghiệp.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {[
            { k: 'R', label: 'R (Realistic): Thích kỹ thuật, lắp ráp, chế tạo robot, sửa chữa linh kiện.' },
            { k: 'I', label: 'I (Investigative): Thích giải toán khó, nghiên cứu khoa học, khám phá công nghệ mới.' },
            { k: 'A', label: 'A (Artistic): Thích thiết kế đồ họa, sáng tạo nội dung, hội họa hoặc biểu diễn nghệ thuật.' },
            { k: 'S', label: 'S (Social): Thích hỗ trợ mọi người, chia sẻ kỹ năng học tập, làm việc nhóm tích cực.' },
            { k: 'E', label: 'E (Enterprising): Thích quản lý đội ngũ, lên kế hoạch kinh doanh, dẫn dắt câu lạc bộ.' },
            { k: 'C', label: 'C (Conventional): Thích tổng hợp thống kê số liệu, làm việc ngăn nắp với sổ sách kế toán.' }
          ].map(q => (
            <div key={q.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1, paddingRight: '12px' }}>{q.label}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRiasecAnswers(prev => ({ ...prev, [q.k]: v }))}
                    className="btn"
                    style={{
                      width: '28px',
                      height: '28px',
                      padding: 0,
                      fontSize: '0.8rem',
                      borderRadius: '50%',
                      border: riasecAnswers[q.k] === v ? '1.5px solid var(--accent-primary)' : '1px solid #cbd5e1',
                      background: riasecAnswers[q.k] === v ? 'var(--accent-primary)' : 'white',
                      color: riasecAnswers[q.k] === v ? 'white' : '#475569'
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleRiasecSave} className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }}>
          Lưu kết quả khảo sát RIASEC
        </button>

        {hasCompletedRiasec && (
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)', borderRadius: '12px', alignItems: 'center' }}>
            {/* SVG Radar network polygon chart */}
            <div>
              <svg width="140" height="140" viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
                {/* Background hexagons */}
                <polygon points="150,50 236,100 236,200 150,250 64,200 64,100" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                <polygon points="150,100 193,125 193,175 150,200 107,175 107,125" fill="none" stroke="#e2e8f0" strokeWidth="1" />

                {/* Axes lines */}
                <line x1="150" y1="150" x2="150" y2="50" stroke="#cbd5e1" />
                <line x1="150" y1="150" x2="236" y2="100" stroke="#cbd5e1" />
                <line x1="150" y1="150" x2="236" y2="200" stroke="#cbd5e1" />
                <line x1="150" y1="150" x2="150" y2="250" stroke="#cbd5e1" />
                <line x1="150" y1="150" x2="64" y2="200" stroke="#cbd5e1" />
                <line x1="150" y1="150" x2="64" y2="100" stroke="#cbd5e1" />

                {/* Labels */}
                <text x="150" y="35" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="middle">R</text>
                <text x="250" y="95" fontSize="16" fontWeight="bold" fill="#64748b">I</text>
                <text x="250" y="215" fontSize="16" fontWeight="bold" fill="#64748b">A</text>
                <text x="150" y="275" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="middle">S</text>
                <text x="45" y="215" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="end">E</text>
                <text x="45" y="95" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="end">C</text>

                {/* Value Polygon */}
                <polygon
                  points={getRadarPointsPath(currentScores)}
                  fill="rgba(99, 102, 241, 0.4)"
                  stroke="var(--accent-primary)"
                  strokeWidth="3.5"
                />
              </svg>
            </div>

            {/* Score mapping profile description */}
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {riasecInfo.name}
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {riasecInfo.desc}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                🛠️ Phù hợp: {riasecInfo.jobs}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* AI School counselor – premium chatbot */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0
          }}>
            <Heart size={20} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Tư Vấn Tâm Lý Học Đường</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>Đang trực tuyến • Phản hồi ngay lập tức</span>
            </div>
          </div>
        </div>

        {/* Mood Check-in */}
        <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.1)' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            🌡️ Hôm nay em đang cảm thấy thế nào?
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'great', emoji: '😄', label: 'Tuyệt vời' },
              { id: 'okay', emoji: '🙂', label: 'Bình thường' },
              { id: 'stressed', emoji: '😰', label: 'Căng thẳng' },
              { id: 'sad', emoji: '😢', label: 'Buồn' },
              { id: 'tired', emoji: '😴', label: 'Mệt mỏi' }
            ].map(mood => (
              <button
                key={mood.id}
                type="button"
                onClick={() => {
                  setCounselorMood(mood.id);
                  handleCounselorQuickReply(`Em đang cảm thấy ${mood.label.toLowerCase()} hôm nay`);
                }}
                style={{
                  padding: '6px 12px', borderRadius: '99px', border: '1.5px solid',
                  borderColor: counselorMood === mood.id ? 'var(--accent-primary)' : 'rgba(99,102,241,0.2)',
                  background: counselorMood === mood.id ? 'rgba(99,102,241,0.1)' : 'white',
                  color: counselorMood === mood.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: '0.78rem', fontWeight: counselorMood === mood.id ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                {mood.emoji} {mood.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div style={{
          height: '400px', border: '1px solid var(--border-card)', borderRadius: '16px',
          background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>

          {/* Chat messages */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="custom-scroll">
            {counselorHistory.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {m.sender !== 'user' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Heart size={12} color="white" />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tư Vấn AI</span>
                  </div>
                )}
                <div style={{
                  maxWidth: '82%', padding: '12px 16px', borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  fontSize: '0.86rem', lineHeight: 1.6, whiteSpace: 'pre-line',
                  background: m.sender === 'user'
                    ? 'linear-gradient(135deg, var(--accent-primary) 0%, #8b5cf6 100%)'
                    : 'white',
                  color: m.sender === 'user' ? 'white' : '#1e293b',
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(99,102,241,0.1)',
                  boxShadow: m.sender === 'user' ? '0 4px 12px rgba(99,102,241,0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  {m.text}
                </div>
                {m.timestamp && (
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {counselorIsTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Heart size={12} color="white" />
                </div>
                <div style={{
                  padding: '10px 16px', borderRadius: '4px 18px 18px 18px',
                  background: 'white', border: '1px solid rgba(99,102,241,0.1)',
                  display: 'flex', gap: '4px', alignItems: 'center'
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      animationName: 'typing-bounce'
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick reply suggestions */}
          {counselorMsgCount === 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', gap: '8px', overflowX: 'auto' }} className="custom-scroll">
              {[
                'Tôi đang bị áp lực thi cử 😰',
                'Giúp tôi chọn ngành phù hợp',
                'Tôi cảm thấy mệt mỏi và mất động lực',
                'Kế hoạch ôn thi hiệu quả'
              ].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleCounselorQuickReply(q)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: '99px',
                    border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)',
                    color: 'var(--accent-primary)', fontSize: '0.76rem', fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat input */}
          <form onSubmit={handleCounselorSend} style={{ display: 'flex', borderTop: '1px solid var(--border-card)', background: 'white', padding: '12px' }}>
            <input
              type="text"
              value={counselorInput}
              onChange={e => setCounselorInput(e.target.value)}
              placeholder={counselorIsTyping ? 'Thầy đang trả lời...' : 'Chia sẻ tâm sự với thầy...'}
              disabled={counselorIsTyping}
              className="form-control"
              style={{ flex: 1, fontSize: '0.85rem', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#1e293b', padding: '10px 16px' }}
            />
            <button
              type="submit"
              disabled={counselorIsTyping || !counselorInput.trim()}
              className="btn btn-primary"
              style={{ padding: '10px 14px', minWidth: 0, borderRadius: '12px', marginLeft: '8px', opacity: (counselorIsTyping || !counselorInput.trim()) ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* Disclaimer */}
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
          🔒 Mọi thông tin em chia sẻ được bảo mật tuyệt đối. AI Tư Vấn không thay thế chuyên gia tâm lý lâm sàng.
          Trong trường hợp khẩn cấp, gọi <strong>1800 599 920</strong>.
        </p>
      </div>

    </div>
  );
}
