const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const expenses = ref([]);
        const newExpense = ref({ description: '', amount: null, category: '' });
        const categories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Other'];
        const isDarkMode = ref(false);
        const expenseChart = ref(null);

        const addExpense = () => {
            if (newExpense.value.description && newExpense.value.amount && newExpense.value.category) {
                expenses.value.push({ ...newExpense.value, date: new Date().toISOString() });
                newExpense.value = { description: '', amount: null, category: '' };
                updateChart();
                saveData();
            }
        };

        const deleteExpense = (index) => {
            expenses.value.splice(index, 1);
            updateChart();
            saveData();
        };

        const updateChart = () => {
            if (expenseChart.value) {
                expenseChart.value.destroy();
            }

            const ctx = document.querySelector('.chart-container canvas').getContext('2d');
            const categoryTotals = categories.reduce((acc, category) => {
                acc[category] = expenses.value
                    .filter(e => e.category === category)
                    .reduce((sum, e) => sum + e.amount, 0);
                return acc;
            }, {});

            expenseChart.value = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: categories.map(c => categoryTotals[c]),
                        backgroundColor: [
                            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        };

        const getCategoryIcon = (category) => {
            const icons = {
                'Food': 'fas fa-utensils',
                'Transport': 'fas fa-car',
                'Entertainment': 'fas fa-film',
                'Utilities': 'fas fa-bolt',
                'Other': 'fas fa-shopping-bag'
            };
            return icons[category] || 'fas fa-question-circle';
        };

        const saveData = () => {
            localStorage.setItem('quantumSpendData', JSON.stringify({
                expenses: expenses.value,
                isDarkMode: isDarkMode.value
            }));
        };

        const loadData = () => {
            const savedData = localStorage.getItem('quantumSpendData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                expenses.value = parsedData.expenses;
                isDarkMode.value = parsedData.isDarkMode;
                updateChart();
            }
        };

        const toggleDarkMode = () => {
            isDarkMode.value = !isDarkMode.value;
            document.body.classList.toggle('dark-mode', isDarkMode.value);
            saveData();
        };

        const exportPDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text('QuantumSpend Expense Report', 14, 22);

            doc.autoTable({
                head: [['Date', 'Description', 'Category', 'Amount']],
                body: expenses.value.map(e => [
                    new Date(e.date).toLocaleDateString(),
                    e.description,
                    e.category,
                    `$${e.amount.toFixed(2)}`
                ]),
                startY: 30
            });

            doc.save('QuantumSpend_Expense_Report.pdf');
        };

        const exportCSV = () => {
            const csvContent = "data:text/csv;charset=utf-8," 
                + "Date,Description,Category,Amount\n"
                + expenses.value.map(e => 
                    `${new Date(e.date).toLocaleDateString()},${e.description},${e.category},$${e.amount.toFixed(2)}`
                ).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "QuantumSpend_Expense_Report.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        onMounted(() => {
            loadData();
            document.body.classList.toggle('dark-mode', isDarkMode.value);
        });

        watch(expenses, updateChart, { deep: true });

        return {
            expenses,
            newExpense,
            categories,
            isDarkMode,
            addExpense,
            deleteExpense,
            getCategoryIcon,
            toggleDarkMode,
            exportPDF,
            exportCSV
        };
    }
}).mount('#app');