import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Book, Bookmark, BookOpen, Search, 
  FileText, X, AlertCircle, Layers 
} from 'lucide-react';

export default function LibraryHub() {
  const {
    currentRole,
    selectedStudentId,
    students,
    libraryBooks,
    bookReservations,
    eBooks,
    reserveBook,
    approveBookReservation,
    collectBook,
    returnBook
  } = useContext(AppContext);

  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];

  // Active Tab: 'physical' or 'ebook'
  const [activeTab, setActiveTab] = useState('physical');

  // Search and Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // E-book reader state
  const [activeEbook, setActiveEbook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter books based on search query and category
  const filteredBooks = (libraryBooks || []).filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories list
  const categories = ['All', ...new Set((libraryBooks || []).map(b => b.category))];

  // Reserve a book
  const handleReserve = (bookId) => {
    if (!student) return;
    // Check if student already has a pending reservation for this book
    const alreadyReserved = (bookReservations || []).some(
      r => r.studentId === student.id && r.bookId === bookId && ['pending', 'ready', 'picked_up'].includes(r.status)
    );
    if (alreadyReserved) {
      alert('Bạn đã đặt mượn hoặc đang giữ cuốn sách này rồi!');
      return;
    }
    reserveBook(bookId, student.id, student.name);
    alert('Đặt giữ sách thành công! Vui lòng đợi thủ thư duyệt sách.');
  };

  // Get active reservations for the current student
  const myReservations = (bookReservations || []).filter(r => r.studentId === student?.id);

  // Format currency/date utilities
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('/');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đợi thủ thư chuẩn bị';
      case 'ready': return 'Sẵn sàng nhận sách';
      case 'picked_up': return 'Đang mượn học tập';
      case 'returned': return 'Đã trả thành công';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ready': return 'badge-success';
      case 'picked_up': return 'badge-info';
      case 'pending': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1050, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.3rem' }}>
            <Book size={22} color="#4f46e5" /> Thư Viện Số & Đặt Sách Thông Minh
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Tra cứu kho sách giấy, đặt giữ chỗ trước để đến thư viện nhận sách nhanh hoặc đọc E-book PDF trực tuyến
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 20, paddingBottom: 8 }}>
        <button 
          onClick={() => setActiveTab('physical')} 
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeTab === 'physical' ? 700 : 500,
            color: activeTab === 'physical' ? '#4f46e5' : 'var(--text-secondary)',
            borderBottom: activeTab === 'physical' ? '2.5px solid #4f46e5' : 'none'
          }}>
          📚 Tủ Sách Thư Viện Trường
        </button>
        <button 
          onClick={() => setActiveTab('ebook')} 
          style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: activeTab === 'ebook' ? 700 : 500,
            color: activeTab === 'ebook' ? '#4f46e5' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ebook' ? '2.5px solid #4f46e5' : 'none'
          }}>
          📱 Đọc E-Books Trực Tuyến
        </button>
      </div>

      {activeTab === 'physical' ? (
        /* PHYSICAL BOOKS CATALOG & LOANS */
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Catalog Left */}
          <div>
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                <input 
                  className="form-control" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên sách, tác giả..." 
                  style={{ fontSize: '0.82rem', paddingLeft: 36, borderRadius: 12 }} 
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <select 
                className="form-control" 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                style={{ width: 150, fontSize: '0.82rem', borderRadius: 12, padding: '8px' }}>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'Tất cả thể loại' : cat}</option>
                ))}
              </select>
            </div>

            {/* Book Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredBooks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.04)' }}>
                  <AlertCircle size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Không tìm thấy cuốn sách nào khớp với tìm kiếm.</p>
                </div>
              ) : (
                filteredBooks.map(book => (
                  <div key={book.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 48, background: 'rgba(79,70,229,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 800, fontSize: '1.1rem' }}>
                        📖
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block', color: '#1e293b' }}>{book.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tác giả: {book.author} | Thể loại: {book.category}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`badge ${
                        book.status === 'available' ? 'badge-success' : book.status === 'reserved' ? 'badge-warning' : 'badge-danger'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {book.status === 'available' ? 'Còn sách' : book.status === 'reserved' ? 'Đã được đặt' : 'Đã mượn'}
                      </span>

                      {currentRole === 'student' && book.status === 'available' && (
                        <button onClick={() => handleReserve(book.id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8 }}>
                          Đặt giữ sách
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bookings / Loans Panel Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Student specific panel */}
            {currentRole === 'student' && (
              <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bookmark size={15} color="#4f46e5" /> Đơn mượn sách của tôi
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto' }}>
                  {myReservations.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Bạn chưa đặt mượn cuốn sách nào.</p>
                  ) : (
                    myReservations.map(res => (
                      <div key={res.id} style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.04)', fontSize: '0.76rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>{res.bookTitle}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 6 }}>Đặt ngày: {formatDate(res.reserveDate)}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge ${getStatusBadgeClass(res.status)}`} style={{ fontSize: '0.66rem' }}>
                            {getStatusText(res.status)}
                          </span>
                          {res.status === 'ready' && (
                            <button onClick={() => alert('Vui lòng mang thẻ học sinh đến thư viện tầng 1 để nhận sách!')} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.65rem', borderRadius: 6 }}>
                              Xem mã nhận
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Librarian Admin Dashboard Panel */}
            {(currentRole === 'teacher' || currentRole === 'admin') && (
              <div style={{ background: 'rgba(255,255,255,0.4)', padding: 20, borderRadius: 20, border: '1px solid var(--border-card)' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={16} color="#4f46e5" /> Quản lý mượn trả (Thủ thư)
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {(bookReservations || []).filter(r => r.status !== 'returned').length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Không có yêu cầu mượn trả sách nào đang xử lý.</p>
                  ) : (
                    (bookReservations || []).filter(r => r.status !== 'returned').map(res => (
                      <div key={res.id} style={{ padding: 12, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div>
                          <strong style={{ color: '#1e293b' }}>{res.bookTitle}</strong>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Người đặt: {res.studentName} • Ngày {formatDate(res.reserveDate)}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <span className={`badge ${getStatusBadgeClass(res.status)}`} style={{ fontSize: '0.66rem' }}>
                            {getStatusText(res.status)}
                          </span>

                          <div style={{ display: 'flex', gap: 4 }}>
                            {res.status === 'pending' && (
                              <button onClick={() => approveBookReservation(res.id)} className="btn btn-primary" style={{ padding: '3px 8px', fontSize: '0.65rem', borderRadius: 6 }}>
                                Chuẩn bị xong
                              </button>
                            )}
                            {res.status === 'ready' && (
                              <button onClick={() => collectBook(res.id)} className="btn btn-secondary" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid rgba(22,163,74,0.2)', padding: '3px 8px', fontSize: '0.65rem', borderRadius: 6 }}>
                                Phát sách
                              </button>
                            )}
                            {res.status === 'picked_up' && (
                              <button onClick={() => returnBook(res.id)} className="btn btn-secondary" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid rgba(220,38,38,0.2)', padding: '3px 8px', fontSize: '0.65rem', borderRadius: 6 }}>
                                Thu hồi sách
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* E-BOOKS ONLINE READING */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
            {eBooks && eBooks.map(eb => (
              <div key={eb.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: 260, justifyContent: 'space-between', boxShadow: '0 4px 14px rgba(0,0,0,0.01)' }}>
                {/* Book Cover mock */}
                <div style={{ 
                  height: 140, background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${eb.readingLink})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  <span style={{ alignSelf: 'flex-start', fontSize: '0.68rem', background: 'rgba(255,255,255,0.25)', color: 'white', padding: '3px 8px', borderRadius: 6, fontWeight: 700, backdropFilter: 'blur(2px)' }}>
                    E-BOOK
                  </span>
                  <strong style={{ color: 'white', fontSize: '0.88rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)', lineHeight: 1.3 }}>{eb.title}</strong>
                </div>

                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1, justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Môn: <strong style={{ color: '#4f46e5' }}>{eb.category}</strong> • Định dạng PDF chuẩn cao học
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 10 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileText size={12} /> 128 trang
                    </span>
                    <button onClick={() => { setActiveEbook(eb); setCurrentPage(1); }} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8, gap: 4 }}>
                      <BookOpen size={12} /> Đọc trực tuyến
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ONLINE EBOOK READER MODAL SCREEN */}
      {activeEbook && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#f8fafc', borderRadius: 24, maxWidth: 900, width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
            {/* Reader Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>📖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>{activeEbook.title}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Chế độ: Đọc trực tuyến • Môn {activeEbook.category}</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveEbook(null)} 
                style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Reader Body Page */}
            <div style={{ flex: 1, padding: 30, display: 'flex', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ 
                background: '#fff', maxWidth: 640, width: '100%', minHeight: 800, padding: '40px 50px', borderRadius: 8, 
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' 
              }}>
                <div>
                  {/* Document Chapter Mock Content */}
                  <h4 style={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.5, color: '#4f46e5', marginBottom: 24, fontSize: '0.85rem' }}>
                    Chương {Math.ceil(currentPage / 3)}: Lý thuyết & Ứng dụng {activeEbook.category}
                  </h4>
                  
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#334155', textAlign: 'justify', marginBottom: 14 }}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#334155', textAlign: 'justify', marginBottom: 14 }}>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  
                  <div style={{ borderLeft: '3px solid #4f46e5', padding: '10px 14px', background: '#f8fafc', margin: '20px 0', fontSize: '0.82rem', fontStyle: 'italic', color: '#475569' }}>
                    * Chú ý trọng tâm thi THPT Quốc Gia: Tập trung giải quyết các dạng toán đồ thị và bài tập điện xoay chiều cực trị RLC.
                  </div>

                  <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#334155', textAlign: 'justify' }}>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                  </p>
                </div>

                <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 14, marginTop: 24 }}>
                  Trang {currentPage} / 128
                </div>
              </div>
            </div>

            {/* Reader Footer Controls */}
            <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary" 
                style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8 }}>
                Trang trước
              </button>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Đang đọc chương {Math.ceil(currentPage / 3)}: Học phần ôn tập 2026
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(128, prev + 1))}
                disabled={currentPage === 128}
                className="btn btn-primary" 
                style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: 8 }}>
                Trang tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
