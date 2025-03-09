window.onload = function () {
    chartAndTable();
};

let energyChart;
let areaChart;

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-button").addEventListener("click", function () {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    function login(username, password) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                console.log("Σύνδεση επιτυχής!");
                window.location.href = "administrator.html";
            } else {
                console.log("Αποτυχία σύνδεσης:", xhr.responseText);
                alert("Λάθος username ή password.");
            }
        };

        xhr.open("POST", "LoginServlet");
        xhr.setRequestHeader("Content-Type", "application/json");
        var data = JSON.stringify({username: username, password: password});
        console.log(data);
        xhr.send(data);
    }
});

function createEnergyChart(date, energy) {
    if (energyChart) {
        energyChart.destroy();
    }

    const ctx = document.getElementById('Chart1').getContext('2d');
    energyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: date,
            datasets: [{
                    label: 'Energy mwh',
                    data: energy,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1,
                    fill: true
                }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {display: false},
                    title: {display: true, text: 'Timestamp'}
                },
                y: {
                    ticks: {display: false},
                    title: {display: true, text: 'Energy mwh'}
                }
            }
        }
    });
}

function createAreaChart(data) {
    if (areaChart) {
        areaChart.destroy();
    }

    const groupedData = {};
    data.forEach(({ area, date, energy_mwh }) => {
        if (!groupedData[area])
            groupedData[area] = {dates: [], energy: []};
        groupedData[area].dates.push(date);
        groupedData[area].energy.push(energy_mwh);
    });

    const datasets = Object.keys(groupedData).map((area, index) => ({
            label: area,
            data: groupedData[area].energy,
            borderColor: ["red", "blue", "green", "purple"][index % 4],
            fill: false
        }));

    const ctx = document.getElementById('Chart2').getContext('2d');
    areaChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: groupedData[Object.keys(groupedData)[0]].dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {position: "top"}
            },
            scales: {
                x: {title: {display: true, text: "Date"}},
                y: {title: {display: true, text: "Energy (MWh)"}}
            }
        }
    });
}

function createTable(data) {
    var table = '<table class="table"><thead><tr><th>Area</th><th>Date</th><th>Energy (MWh)</th></tr></thead><tbody>';
    data.forEach(function (item) {
        table += '<tr>';
        table += '<td>' + item.area + '</td>';
        table += '<td>' + item.date + '</td>';
        table += '<td>' + item.energy_mwh + '</td>';
        table += '</tr>';
    });

    table += '</tbody></table>';
    document.getElementById('table-container').innerHTML = table;
}

function loadAreas(data) {
    const areaSet = new Set(data.map(item => item.area));
    const sortedAreas = [...areaSet].sort();

    const areaSelect = document.getElementById("area-filter");
    sortedAreas.forEach(area => {
        let option = document.createElement("option");
        option.value = area;
        option.textContent = area;
        areaSelect.appendChild(option);
    });
}

function chartAndTable() {
    var dataType = "ElectricityConsumption";
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const lastData = data.slice(-20);

            const timestamps = lastData.map(item => item.date);
            const damVolumes = lastData.map(item => parseFloat(item.energy_mwh));

            createEnergyChart(timestamps, damVolumes);
            createAreaChart(data);
            createTable(data);
            loadAreas(data);

            data.sort(function (a, b) {
                return new Date(a.date) - new Date(b.date);
            });

            const firstDate = new Date(data[0].date);
            const lastDate = new Date(data[data.length - 1].date);

            const minDate = formatDate(firstDate);
            const maxDate = formatDate(lastDate);

            flatpickr(".date-input", {
                dateFormat: "d/m/Y",
                minDate: minDate,
                maxDate: maxDate
            });
        } else {
            var response = xhr.responseText;
            console.log(response);
        }
    };
    var url = 'GetAllData?dataType=' + dataType;
    xhr.open('GET', url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send();
}

function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', function () {
    const filterButton = document.getElementById('search-button');
    if (filterButton) {
        filterButton.addEventListener('click', function () {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            const min = document.getElementById('min-energy').value;
            const max = document.getElementById('max-energy').value;
            const area = document.getElementById("area-filter").value;

            filterSearch(startDate, endDate, area, min, max);
        });
    }
});

function filterSearch(startDate, endDate, area, min, max) {
    var dataType = "ElectricityConsumption";
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);

            const timestamps = data.map(item => item.date);
            const damVolumes = data.map(item => parseFloat(item.energy_mwh));

            createEnergyChart(timestamps, damVolumes);
            createTable(data);
            createAreaChart(data);
        } else {
            console.log(xhr.responseText);
        }
    };
    var url = 'FilterDataServlet?dataType=' + dataType + '&start-date=' + startDate + '&end-date=' + endDate + '&min-energy=' + min + '&max-energy=' + max + '&area-filter=' + area;
    xhr.open('GET', url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send();
}