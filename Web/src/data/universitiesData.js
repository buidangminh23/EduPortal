/**
 * Vietnamese universities with last year's cut-off score per major.
 *
 * Shared by the university matchmaker and the counselling result panel, so a
 * major recommended after the RIASEC survey and the same major in the search
 * results can never disagree about its cut-off, exam block or Holland fit.
 */

export const UNIVERSITY_DB = [
  // ── HÀ NỘI ──
  { id: 'UNI01', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Công nghệ thông tin (IT1)', group: 'A00', cutoff: 27.8, fee: 'Trung bình (35-45tr/năm)', type: 'public', desc: 'Ngành học mũi nhọn hàng đầu cả nước, tỷ lệ việc làm cao, yêu cầu tư duy toán học cực tốt.', riasecMatches: ['R', 'I'] },
  { id: 'UNI02', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Kỹ thuật Điện tử - Viễn thông', group: 'A01', cutoff: 26.2, fee: 'Trung bình (30-40tr/năm)', type: 'public', desc: 'Đào tạo kỹ sư chuyên sâu phần cứng và viễn thông di động, robotics.', riasecMatches: ['R', 'I'] },
  { id: 'UNI02_1', name: 'Đại học Bách Khoa Hà Nội', code: 'HUST', city: 'Hà Nội', major: 'Kỹ thuật Ô tô', group: 'A00', cutoff: 25.5, fee: 'Trung bình (30-40tr/năm)', type: 'public', desc: 'Kỹ thuật thiết kế chế tạo cơ khí ô tô, xe điện và hệ thống thông minh.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI03', name: 'Đại học Ngoại Thương', code: 'FTU', city: 'Hà Nội', major: 'Kinh tế đối ngoại', group: 'D01', cutoff: 28.3, fee: 'Trung bình (25-35tr/năm)', type: 'public', desc: 'Thương hiệu top 1 về khối ngành kinh tế, môi trường năng động, cơ hội giao thương quốc tế cao.', riasecMatches: ['E', 'S'] },
  { id: 'UNI04', name: 'Đại học Ngoại Thương', code: 'FTU', city: 'Hà Nội', major: 'Quản trị kinh doanh', group: 'A01', cutoff: 27.5, fee: 'Trung bình (25-35tr/năm)', type: 'public', desc: 'Đào tạo tư duy lãnh đạo, khởi nghiệp, marketing chiến lược doanh nghiệp.', riasecMatches: ['E', 'C'] },
  
  { id: 'UNI05', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Marketing', group: 'D01', cutoff: 27.2, fee: 'Chất lượng cao (40-60tr/năm)', type: 'hq', desc: 'Khoa đào tạo Marketing lâu đời và uy tín nhất miền Bắc, chú trọng nghiên cứu thị trường thực tế.', riasecMatches: ['E', 'A'] },
  { id: 'UNI06', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', group: 'A00', cutoff: 26.8, fee: 'Trung bình (20-30tr/năm)', type: 'public', desc: 'Hệ thống tài chính doanh nghiệp bài bản, có phòng lab thực hành thị trường chứng khoán giả lập.', riasecMatches: ['C', 'E'] },
  { id: 'UNI06_1', name: 'Đại học Kinh Tế Quốc Dân', code: 'NEU', city: 'Hà Nội', major: 'Logistics & Quản lý chuỗi cung ứng', group: 'A01', cutoff: 27.4, fee: 'Chất lượng cao (40-60tr/năm)', type: 'hq', desc: 'Tối ưu hoá vận chuyển, kho bãi và mạng lưới cung ứng quốc tế.', riasecMatches: ['C', 'E'] },

  { id: 'UNI07', name: 'Đại học Y Hà Nội', code: 'HMU', city: 'Hà Nội', major: 'Y đa khoa', group: 'B00', cutoff: 28.1, fee: 'Trung bình (40-50tr/năm)', type: 'public', desc: 'Ngành học danh giá nhất ngành Y, thời gian đào tạo 6 năm áp lực cực cao nhưng đầu ra vô cùng đảm bảo.', riasecMatches: ['I', 'S'] },
  { id: 'UNI08', name: 'Đại học Y Hà Nội', code: 'HMU', city: 'Hà Nội', major: 'Răng - Hàm - Mặt', group: 'B00', cutoff: 27.8, fee: 'Trung bình (40-50tr/năm)', type: 'public', desc: 'Thế mạnh phục hình và y khoa thẩm mỹ, kỹ năng thực hành vi phẫu lâm sàng chuẩn hóa.', riasecMatches: ['I', 'R'] },

  { id: 'UNI09', name: 'Đại học Quốc gia Hà Nội (UET)', code: 'VNU-UET', city: 'Hà Nội', major: 'Khoa học máy tính', group: 'A00', cutoff: 27.0, fee: 'Trung bình (28-35tr/năm)', type: 'public', desc: 'Chú trọng nghiên cứu giải thuật toán nâng cao, mật mã và trí tuệ nhân tạo chuyên sâu.', riasecMatches: ['I', 'R'] },
  { id: 'UNI09_1', name: 'Đại học Quốc gia Hà Nội (USSH)', code: 'VNU-USSH', city: 'Hà Nội', major: 'Báo chí', group: 'C00', cutoff: 28.5, fee: 'Trung bình (15-20tr/năm)', type: 'public', desc: 'Đào tạo kỹ năng báo chí, truyền thông đa phương tiện thực chiến.', riasecMatches: ['A', 'S'] },
  { id: 'UNI09_2', name: 'Đại học Quốc gia Hà Nội (USSH)', code: 'VNU-USSH', city: 'Hà Nội', major: 'Tâm lý học', group: 'C00', cutoff: 27.0, fee: 'Trung bình (15-20tr/năm)', type: 'public', desc: 'Nghiên cứu hành vi, tư vấn tâm lý học đường và tâm lý trị liệu.', riasecMatches: ['S', 'I'] },

  { id: 'UNI10', name: 'Đại học Luật Hà Nội', code: 'HLU', city: 'Hà Nội', major: 'Luật thương mại quốc tế', group: 'C00', cutoff: 26.5, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Trọng điểm nghiên cứu pháp lý thương mại toàn cầu, phù hợp làm cố vấn doanh nghiệp FDI.', riasecMatches: ['C', 'E'] },
  { id: 'UNI10_1', name: 'Đại học Luật Hà Nội', code: 'HLU', city: 'Hà Nội', major: 'Luật kinh tế', group: 'A00', cutoff: 25.8, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Bảo vệ lợi ích pháp lý trong kinh doanh và giải quyết tranh chấp thương mại.', riasecMatches: ['C', 'E'] },

  { id: 'UNI11', name: 'Đại học Sư Phạm Hà Nội', code: 'HNUE', city: 'Hà Nội', major: 'Sư phạm Tiếng Anh', group: 'D01', cutoff: 26.9, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo kỹ năng giảng dạy và sư phạm chuẩn quốc tế, sinh viên được trợ cấp sinh hoạt phí.', riasecMatches: ['S', 'A'] },
  { id: 'UNI12', name: 'Đại học Sư Phạm Hà Nội', code: 'HNUE', city: 'Hà Nội', major: 'Sư phạm Toán học', group: 'A00', cutoff: 26.0, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Cái nôi đào tạo chuyên gia và giáo viên Toán chuyên cho các khối trường THPT trọng điểm.', riasecMatches: ['S', 'I'] },
  
  { id: 'UNI_DAV1', name: 'Học viện Ngoại giao', code: 'DAV', city: 'Hà Nội', major: 'Quan hệ quốc tế', group: 'D01', cutoff: 27.0, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Đào tạo cán bộ ngoại giao, chuyên viên hợp tác quốc tế, tổ chức phi chính phủ.', riasecMatches: ['S', 'E'] },
  { id: 'UNI_DAV2', name: 'Học viện Ngoại giao', code: 'DAV', city: 'Hà Nội', major: 'Truyền thông quốc tế', group: 'D01', cutoff: 26.8, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Sự kết hợp giữa báo chí đối ngoại, PR và kỹ năng quản trị sự kiện quốc tế.', riasecMatches: ['A', 'E'] },

  { id: 'UNI_AOF1', name: 'Học viện Tài chính', code: 'AOF', city: 'Hà Nội', major: 'Kế toán doanh nghiệp', group: 'A00', cutoff: 25.8, fee: 'Trung bình (22-25tr/năm)', type: 'public', desc: 'Kế toán tài chính, kiểm toán và phân tích báo cáo tài chính chuẩn mực.', riasecMatches: ['C', 'E'] },
  { id: 'UNI_BA1', name: 'Học viện Ngân hàng', code: 'BA', city: 'Hà Nội', major: 'Tài chính - Ngân hàng', group: 'A01', cutoff: 25.5, fee: 'Trung bình (22-25tr/năm)', type: 'public', desc: 'Nghiệp vụ ngân hàng thương mại, đầu tư chứng khoán và định giá tài sản.', riasecMatches: ['C', 'E'] },

  // ── TP. HỒ CHÍ MINH ──
  { id: 'UNI13', name: 'Đại học Bách Khoa TP.HCM', code: 'HCMUT', city: 'TP. Hồ Chí Minh', major: 'Khoa học Máy tính', group: 'A00', cutoff: 27.2, fee: 'Chất lượng cao (35-45tr/năm)', type: 'hq', desc: 'Đại học đào tạo kỹ thuật công nghệ top 1 miền Nam với kiểm định quốc tế ABET danh giá.', riasecMatches: ['R', 'I'] },
  { id: 'UNI13_1', name: 'Đại học Bách Khoa TP.HCM', code: 'HCMUT', city: 'TP. Hồ Chí Minh', major: 'Kỹ thuật Hóa học', group: 'A00', cutoff: 24.5, fee: 'Trung bình (28-32tr/năm)', type: 'public', desc: 'Công nghệ lọc hoá dầu, vật liệu polyme và công nghệ hoá sinh học ứng dụng.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI14', name: 'Đại học Kinh Tế TP.HCM', code: 'UEH', city: 'TP. Hồ Chí Minh', major: 'Kinh doanh quốc tế', group: 'A01', cutoff: 26.9, fee: 'Trung bình (30-38tr/năm)', type: 'public', desc: 'Đào tạo logistics, chuỗi cung ứng toàn cầu và quản trị ngoại thương năng động.', riasecMatches: ['E', 'C'] },
  { id: 'UNI14_1', name: 'Đại học Kinh Tế TP.HCM', code: 'UEH', city: 'TP. Hồ Chí Minh', major: 'Thương mại điện tử', group: 'D01', cutoff: 26.5, fee: 'Chất lượng cao (38-45tr/năm)', type: 'hq', desc: 'Ứng dụng kinh doanh trực tuyến, chuyển đổi số doanh nghiệp và tối ưu SEO/ADS.', riasecMatches: ['E', 'C'] },

  { id: 'UNI_UIT1', name: 'Đại học Công nghệ thông tin ĐHQG-HCM', code: 'UIT', city: 'TP. Hồ Chí Minh', major: 'Kỹ thuật Phần mềm', group: 'A00', cutoff: 26.8, fee: 'Trung bình (30-35tr/năm)', type: 'public', desc: 'Quy trình phát triển phần mềm chuẩn công nghiệp, kiến trúc phần mềm nâng cao.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_UIT2', name: 'Đại học Công nghệ thông tin ĐHQG-HCM', code: 'UIT', city: 'TP. Hồ Chí Minh', major: 'An toàn thông tin', group: 'A01', cutoff: 26.0, fee: 'Chất lượng cao (40-48tr/năm)', type: 'hq', desc: 'Bảo mật mạng, mật mã học, phân tích mã độc và phòng chống tấn công mạng.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_USSH_HCM1', name: 'Đại học KHXH&NV TP.HCM', code: 'USSH-HCM', city: 'TP. Hồ Chí Minh', major: 'Quan hệ quốc tế', group: 'D01', cutoff: 26.5, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Phân tích chính sách, nghiệp vụ lãnh sự và báo chí truyền thông quốc tế.', riasecMatches: ['S', 'E'] },
  { id: 'UNI_USSH_HCM2', name: 'Đại học KHXH&NV TP.HCM', code: 'USSH-HCM', city: 'TP. Hồ Chí Minh', major: 'Ngôn ngữ Anh', group: 'D01', cutoff: 26.2, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Biên phiên dịch, văn học Anh-Mỹ và kỹ năng tiếng Anh học thuật nâng cao.', riasecMatches: ['A', 'S'] },

  { id: 'UNI_UMP1', name: 'Đại học Y Dược TP.HCM', code: 'UMP', city: 'TP. Hồ Chí Minh', major: 'Y đa khoa', group: 'B00', cutoff: 27.8, fee: 'Trung bình (45-55tr/năm)', type: 'public', desc: 'Trọng điểm y khoa miền Nam, bác sĩ thực tập nội trú tại các bệnh viện lớn.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_UMP2', name: 'Đại học Y Dược TP.HCM', code: 'UMP', city: 'TP. Hồ Chí Minh', major: 'Dược học', group: 'B00', cutoff: 26.5, fee: 'Trung bình (45-55tr/năm)', type: 'public', desc: 'Nghiên cứu bào chế thuốc, quản lý dược và tư vấn dược học lâm sàng.', riasecMatches: ['I', 'R'] },

  { id: 'UNI_UTE1', name: 'Đại học Sư phạm Kỹ thuật TP.HCM', code: 'HCMUTE', city: 'TP. Hồ Chí Minh', major: 'Công nghệ kỹ thuật ô tô', group: 'A00', cutoff: 25.2, fee: 'Chất lượng cao (32-38tr/năm)', type: 'hq', desc: 'Hệ thống cơ điện tử ô tô, chẩn đoán lỗi, bảo dưỡng ô tô thông minh.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_ULAW_HCM', name: 'Đại học Luật TP.HCM', code: 'ULAW', city: 'TP. Hồ Chí Minh', major: 'Luật thương mại', group: 'C00', cutoff: 26.0, fee: 'Trung bình (20-24tr/năm)', type: 'public', desc: 'Đào tạo luật sư tư vấn giải quyết tranh chấp kinh tế, hợp đồng thương mại.', riasecMatches: ['C', 'E'] },

  { id: 'UNI15', name: 'Đại học RMIT Việt Nam', code: 'RMIT', city: 'TP. Hồ Chí Minh', major: 'Thiết kế ứng dụng sáng tạo', group: 'D01', cutoff: 20.0, fee: 'Tư thục/Quốc tế (>250tr/năm)', type: 'intl', desc: 'Bằng đại học Australia trực tiếp, tập trung tối đa tư duy thiết kế, portfolio thực chiến xuất sắc.', riasecMatches: ['A', 'E'] },
  { id: 'UNI15_1', name: 'Đại học RMIT Việt Nam', code: 'RMIT', city: 'TP. Hồ Chí Minh', major: 'Công nghệ thông tin', group: 'A01', cutoff: 21.0, fee: 'Tư thục/Quốc tế (>250tr/năm)', type: 'intl', desc: 'Chương trình chuẩn quốc tế, mạng lưới cựu sinh viên toàn cầu chất lượng cao.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_FUL1', name: 'Đại học Fulbright Việt Nam', code: 'FUV', city: 'TP. Hồ Chí Minh', major: 'Khoa học tích hợp', group: 'A01', cutoff: 22.5, fee: 'Tư thục/Quốc tế (>200tr/năm)', type: 'intl', desc: 'Mô hình khai phóng của Mỹ, khuyến khích liên ngành toán học và khoa học tự nhiên.', riasecMatches: ['I', 'A'] },

  // ── ĐÀ NẴNG ──
  { id: 'UNI16', name: 'Đại học FPT', code: 'FPTU', city: 'Đà Nẵng', major: 'Kỹ thuật phần mềm', group: 'A01', cutoff: 21.0, fee: 'Tư thục/Quốc tế (70-90tr/năm)', type: 'intl', desc: 'Chương trình đào tạo gắn liền với thực tập doanh nghiệp tại FPT Software, giáo trình 100% tiếng Anh.', riasecMatches: ['R', 'I'] },
  
  { id: 'UNI_DUT1', name: 'Đại học Bách khoa - ĐH Đà Nẵng', code: 'DUT', city: 'Đà Nẵng', major: 'Công nghệ thông tin (Đặc thù)', group: 'A00', cutoff: 25.8, fee: 'Trung bình (25-30tr/năm)', type: 'public', desc: 'Đào tạo Kỹ sư CNTT trọng điểm miền Trung, liên kết doanh nghiệp Nhật Bản.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_DUT2', name: 'Đại học Bách khoa - ĐH Đà Nẵng', code: 'DUT', city: 'Đà Nẵng', major: 'Kỹ thuật Điều khiển & Tự động hóa', group: 'A00', cutoff: 24.5, fee: 'Trung bình (25-30tr/năm)', type: 'public', desc: 'Hệ thống SCADA, PLC, tự động hoá dây chuyền nhà máy thông minh.', riasecMatches: ['R', 'I'] },

  { id: 'UNI_UE_DN1', name: 'Đại học Kinh tế - ĐH Đà Nẵng', code: 'DUE', city: 'Đà Nẵng', major: 'Quản trị kinh doanh', group: 'D01', cutoff: 24.8, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Đào tạo quản lý, khởi nghiệp, marketing thích ứng kinh tế số miền Trung.', riasecMatches: ['E', 'C'] },
  { id: 'UNI_UE_DN2', name: 'Đại học Kinh tế - ĐH Đà Nẵng', code: 'DUE', city: 'Đà Nẵng', major: 'Quản trị dịch vụ du lịch & lữ hành', group: 'A01', cutoff: 24.0, fee: 'Trung bình (22-26tr/năm)', type: 'public', desc: 'Thế mạnh đào tạo quản lý khách sạn, resort cao cấp tại thủ phủ du lịch Đà Nẵng.', riasecMatches: ['S', 'E'] },

  { id: 'UNI_UFL_DN1', name: 'Đại học Ngoại ngữ - ĐH Đà Nẵng', code: 'UFL', city: 'Đà Nẵng', major: 'Ngôn ngữ Anh (Sư phạm)', group: 'D01', cutoff: 25.0, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo giáo viên tiếng Anh trung học, phương pháp sư phạm hiện đại.', riasecMatches: ['S', 'A'] },

  // ── CẦN THƠ ──
  { id: 'UNI_CTU1', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Công nghệ thông tin', group: 'A00', cutoff: 24.0, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Trọng điểm nghiên cứu CNTT và phát triển phần mềm vùng Đồng bằng Sông Cửu Long.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_CTU2', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Kinh doanh quốc tế', group: 'D01', cutoff: 24.2, fee: 'Trung bình (20-25tr/năm)', type: 'public', desc: 'Phù hợp định hướng xuất nhập khẩu nông thuỷ sản và giao thương quốc tế khu vực Tây Nam Bộ.', riasecMatches: ['E', 'C'] },
  { id: 'UNI_CTU3', name: 'Đại học Cần Thơ', code: 'CTU', city: 'Cần Thơ', major: 'Y đa khoa (Khoa Y)', group: 'B00', cutoff: 25.5, fee: 'Trung bình (35-42tr/năm)', type: 'public', desc: 'Đào tạo bác sĩ đa khoa phục vụ mạng lưới y tế công lập miền Tây.', riasecMatches: ['I', 'S'] },

  // ── HUẾ ──
  { id: 'UNI_HUI1', name: 'Trường Đại học Y Dược - Đại học Huế', code: 'HUMP', city: 'Huế', major: 'Y đa khoa', group: 'B00', cutoff: 26.0, fee: 'Trung bình (35-40tr/năm)', type: 'public', desc: 'Cơ sở đào tạo y khoa uy tín hàng đầu miền Trung, thế mạnh nghiên cứu khoa học y học.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_HUI2', name: 'Trường Đại học Sư phạm - Đại học Huế', code: 'HUE', city: 'Huế', major: 'Sư phạm Toán học', group: 'A00', cutoff: 23.5, fee: 'Miễn học phí (Cam kết phục vụ)', type: 'public', desc: 'Đào tạo giáo viên toán chất lượng cao, phát triển tư duy học sinh.', riasecMatches: ['S', 'I'] },

  // ── BÌNH DƯƠNG ──
  { id: 'UNI_VGU1', name: 'Đại học Việt Đức', code: 'VGU', city: 'Bình Dương', major: 'Khoa học máy tính', group: 'A00', cutoff: 23.0, fee: 'Tư thục/Quốc tế (80-100tr/năm)', type: 'intl', desc: 'Đại học công lập mô hình Đức, bằng do trường đối tác Đức cấp, học hoàn toàn bằng tiếng Anh.', riasecMatches: ['R', 'I'] },
  { id: 'UNI_VIN1', name: 'Đại học VinUniversity', code: 'VinUni', city: 'Hà Nội', major: 'Y khoa', group: 'B00', cutoff: 24.5, fee: 'Tư thục/Quốc tế (>300tr/năm)', type: 'intl', desc: 'Liên kết Ivy League Cornell & Penn, học bổng hào phóng, trang thiết bị tối tân.', riasecMatches: ['I', 'S'] },
  { id: 'UNI_VIN2', name: 'Đại học VinUniversity', code: 'VinUni', city: 'Hà Nội', major: 'Quản trị kinh doanh', group: 'D01', cutoff: 23.0, fee: 'Tư thục/Quốc tế (>300tr/năm)', type: 'intl', desc: 'Đào tạo tư duy kinh doanh toàn cầu, thực tập sớm tại các tập đoàn đa quốc gia.', riasecMatches: ['E', 'C'] }
];
