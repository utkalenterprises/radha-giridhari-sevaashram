// App.js - Main application component
function App() {
  // State for members, subscription data, and UI controls
  const [members, setMembers] = React.useState(() => {
    const savedMembers = localStorage.getItem('members');
    return savedMembers ? JSON.parse(savedMembers) : [];
  });
  const [currentView, setCurrentView] = React.useState('dashboard');
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    subscriptionAmount: '',
    startDate: '',
    notes: ''
  });
  const [filterMonth, setFilterMonth] = React.useState(new Date().getMonth());
  const [filterYear, setFilterYear] = React.useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = React.useState('');

  // Save members data to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('members', JSON.stringify(members));
  }, [members]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Add new member
  const addMember = (e) => {
    e.preventDefault();
    const newMember = {
      id: Date.now().toString(),
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      subscriptionAmount: parseFloat(formData.subscriptionAmount),
      startDate: formData.startDate,
      paymentHistory: [],
      remindersSent: [],
      notes: formData.notes,
      isActive: true
    };
    setMembers([...members, newMember]);
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      subscriptionAmount: '',
      startDate: '',
      notes: ''
    });
    setCurrentView('dashboard');
  };

  // Record payment
  const recordPayment = (memberId) => {
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return;

    // Get payment details
    const paymentDate = document.getElementById(`payment-date-${memberId}`).value;
    const paymentAmount = parseFloat(document.getElementById(`payment-amount-${memberId}`).value);
    const paymentNotes = document.getElementById(`payment-notes-${memberId}`).value;

    if (!paymentDate || isNaN(paymentAmount)) {
      alert('Please enter valid payment details');
      return;
    }

    // Create new payment record
    const paymentRecord = {
      id: Date.now().toString(),
      date: paymentDate,
      amount: paymentAmount,
      notes: paymentNotes,
      collectedBy: 'Current User', // In a real app, this would be the logged-in user
      collectionMethod: 'Cash' // Default to cash for door-to-door collection
    };

    // Update member's payment history
    const updatedMembers = [...members];
    updatedMembers[memberIndex].paymentHistory = [
      ...updatedMembers[memberIndex].paymentHistory,
      paymentRecord
    ];

    setMembers(updatedMembers);

    // Reset form fields
    document.getElementById(`payment-date-${memberId}`).value = '';
    document.getElementById(`payment-amount-${memberId}`).value = '';
    document.getElementById(`payment-notes-${memberId}`).value = '';
  };

  // Send reminder
  const sendReminder = (memberId) => {
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return;

    const member = members[memberIndex];
    
    // In a real application, this would trigger an SMS, email, or notification
    // For this demo, we'll just record that a reminder was sent
    const reminderRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      method: document.getElementById(`reminder-method-${memberId}`).value,
      message: document.getElementById(`reminder-message-${memberId}`).value || 'Friendly reminder about your monthly subscription',
      sentBy: 'Current User' // In a real app, this would be the logged-in user
    };

    // Update member's reminders
    const updatedMembers = [...members];
    updatedMembers[memberIndex].remindersSent = [
      ...updatedMembers[memberIndex].remindersSent,
      reminderRecord
    ];

    setMembers(updatedMembers);
    alert(`Reminder sent to ${member.name}!`);

    // Reset form fields
    document.getElementById(`reminder-message-${memberId}`).value = '';
  };

  // View member details
  const viewMemberDetails = (memberId) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setCurrentView('memberDetails');
    }
  };

  // Calculate if payment is due
  const isPaymentDue = (member) => {
    const currentDate = new Date();
    // If no payment history, payment is due if start date is in the past
    if (member.paymentHistory.length === 0) {
      return new Date(member.startDate) <= currentDate;
    }

    // Get the last payment date
    const lastPayment = [...member.paymentHistory].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];

    const lastPaymentDate = new Date(lastPayment.date);
    // Calculate the next payment due date (one month after last payment)
    const nextDueDate = new Date(lastPaymentDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    return nextDueDate <= currentDate;
  };

  // Filter members by search query
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone.includes(searchQuery)
  );

  // Get payments for the selected month and year
  const getMonthlyPayments = () => {
    let total = 0;
    let collected = 0;
    let pending = 0;

    members.forEach(member => {
      if (!member.isActive) return;
      
      // Add to total expected
      total += member.subscriptionAmount;
      
      // Check if payment was made in selected month/year
      const paymentInMonth = member.paymentHistory.find(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate.getMonth() === filterMonth && 
               paymentDate.getFullYear() === filterYear;
      });
      
      if (paymentInMonth) {
        collected += paymentInMonth.amount;
      } else {
        pending += member.subscriptionAmount;
      }
    });

    return { total, collected, pending };
  };

  const monthlyStats = getMonthlyPayments();

  // Render different views based on currentView state
  const renderView = () => {
    switch(currentView) {
      case 'addMember':
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Add New Member</h2>
            <form onSubmit={addMember}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Address *</label>
                <textarea 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Phone *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Subscription Amount (₹) *</label>
                <input 
                  type="number" 
                  name="subscriptionAmount" 
                  value={formData.subscriptionAmount} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                  min="1" 
                  step="any" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Start Date *</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                  required 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded" 
                />
              </div>
              
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setCurrentView('dashboard')} 
                  className="mr-2 px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'memberDetails':
        if (!selectedMember) return <div>No member selected</div>;
        
        // Sort payment history by date (newest first)
        const sortedPayments = [...selectedMember.paymentHistory].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        // Sort reminders by date (newest first)
        const sortedReminders = [...selectedMember.remindersSent].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
        
        return (
          <div className="p-4 bg-white rounded shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Member Details</h2>
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Back to Dashboard
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-bold mb-2">Personal Information</h3>
                <p><strong>Name:</strong> {selectedMember.name}</p>
                <p><strong>Address:</strong> {selectedMember.address}</p>
                <p><strong>Phone:</strong> {selectedMember.phone}</p>
                <p><strong>Email:</strong> {selectedMember.email || 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">Subscription Details</h3>
                <p><strong>Amount:</strong> ₹{selectedMember.subscriptionAmount}</p>
                <p><strong>Start Date:</strong> {selectedMember.startDate}</p>
                <p><strong>Status:</strong> {selectedMember.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Payment Due:</strong> {isPaymentDue(selectedMember) ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Notes</h3>
              <p>{selectedMember.notes || 'No notes available'}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Record Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Date</label>
                  <input 
                    type="date" 
                    id={`payment-date-${selectedMember.id}`} 
                    className="w-full p-2 border rounded" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Amount (₹)</label>
                  <input 
                    type="number" 
                    id={`payment-amount-${selectedMember.id}`} 
                    className="w-full p-2 border rounded" 
                    defaultValue={selectedMember.subscriptionAmount}
                    min="1" 
                    step="any"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Notes</label>
                  <input 
                    type="text" 
                    id={`payment-notes-${selectedMember.id}`} 
                    className="w-full p-2 border rounded" 
                    placeholder="Month covered, etc."
                  />
                </div>
              </div>
              
              <button 
                onClick={() => recordPayment(selectedMember.id)} 
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              >
                Record Cash Payment
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Send Reminder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Method</label>
                  <select 
                    id={`reminder-method-${selectedMember.id}`} 
                    className="w-full p-2 border rounded"
                  >
                    <option value="sms">SMS</option>
                    <option value="phone">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Message</label>
                  <input 
                    type="text" 
                    id={`reminder-message-${selectedMember.id}`} 
                    className="w-full p-2 border rounded" 
                    placeholder="Custom message (optional)"
                  />
                </div>
              </div>
              
              <button 
                onClick={() => sendReminder(selectedMember.id)} 
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Send Reminder
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">Payment History</h3>
              {sortedPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Amount</th>
                        <th className="py-2 px-4 border-b">Collected By</th>
                        <th className="py-2 px-4 border-b">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPayments.map(payment => (
                        <tr key={payment.id}>
                          <td className="py-2 px-4 border-b">{payment.date}</td>
                          <td className="py-2 px-4 border-b">₹{payment.amount}</td>
                          <td className="py-2 px-4 border-b">{payment.collectedBy}</td>
                          <td className="py-2 px-4 border-b">{payment.notes || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No payment records available</p>
              )}
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Reminder History</h3>
              {sortedReminders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Method</th>
                        <th className="py-2 px-4 border-b">Message</th>
                        <th className="py-2 px-4 border-b">Sent By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReminders.map(reminder => (
                        <tr key={reminder.id}>
                          <td className="py-2 px-4 border-b">{reminder.date}</td>
                          <td className="py-2 px-4 border-b">{reminder.method}</td>
                          <td className="py-2 px-4 border-b">{reminder.message}</td>
                          <td className="py-2 px-4 border-b">{reminder.sentBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No reminder records available</p>
              )}
            </div>
          </div>
        );
        
      case 'dashboard':
      default:
        return (
          <div>
            <div className="p-4 bg-white rounded shadow mb-6">
              <h2 className="text-xl font-bold mb-4">Radha Giridhari Sevaashram</h2>
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h3 className="font-bold">Monthly Collection Statistics</h3>
                  <div className="flex space-x-2 my-2">
                    <select 
                      value={filterMonth} 
                      onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                      className="p-2 border rounded"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select 
                      value={filterYear} 
                      onChange={(e) => setFilterYear(parseInt(e.target.value))}
                      className="p-2 border rounded"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-blue-100 rounded">
                      <p className="text-sm">Expected</p>
                      <p className="font-bold">₹{monthlyStats.total.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded">
                      <p className="text-sm">Collected</p>
                      <p className="font-bold">₹{monthlyStats.collected.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded">
                      <p className="text-sm">Pending</p>
                      <p className="font-bold">₹{monthlyStats.pending.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => setCurrentView('addMember')} 
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Add New Member
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <input 
                  type="text" 
                  placeholder="Search by name, address, or phone" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full p-2 border rounded" 
                />
              </div>
            </div>
            
            <div className="p-4 bg-white rounded shadow">
              <h3 className="font-bold mb-4">Members ({filteredMembers.length})</h3>
              {filteredMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b">Name</th>
                        <th className="py-2 px-4 border-b">Address</th>
                        <th className="py-2 px-4 border-b">Phone</th>
                        <th className="py-2 px-4 border-b">Subscription</th>
                        <th className="py-2 px-4 border-b">Status</th>
                        <th className="py-2 px-4 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map(member => (
                        <tr key={member.id} className={isPaymentDue(member) ? 'bg-red-50' : ''}>
                          <td className="py-2 px-4 border-b">{member.name}</td>
                          <td className="py-2 px-4 border-b">{member.address}</td>
                          <td className="py-2 px-4 border-b">{member.phone}</td>
                          <td className="py-2 px-4 border-b">₹{member.subscriptionAmount}</td>
                          <td className="py-2 px-4 border-b">
                            {isPaymentDue(member) ? 
                              <span className="text-red-500 font-bold">Payment Due</span> : 
                              <span className="text-green-500">Current</span>
                            }
                          </td>
                          <td className="py-2 px-4 border-b">
                            <button 
                              onClick={() => viewMemberDetails(member.id)} 
                              className="px-3 py-1 bg-blue-100 text-blue-800 rounded mr-2"
                            >
                              View
                            </button>
                            {isPaymentDue(member) && (
                              <button 
                                onClick={() => {
                                  viewMemberDetails(member.id);
                                }} 
                                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded"
                              >
                                Remind
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No members found. Add members to get started.</p>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto">
        {renderView()}
      </div>
    </div>
  );
}

// Render the App component to the DOM
ReactDOM.render(<App />, document.getElementById('root'));
