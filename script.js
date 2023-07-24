const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isStart = false;
const buttonStart = document.getElementById('start');

let size = 100;
const stateColors = new Map([
	['HEALTH', 'green'],
	['SICK', 'red'],
	['DEAD', 'black'],
	['IMM', 'blue'],
	['ABS_IMM', 'yellow'],
	['VACCINE', 'PURPLE'],
]);

let dayCounter = 0;

let num_dead = 0;
let num_sick = 0;
let num_recovered = 0;
let num_vaccine = 0;
let num_susceptible = 0;
let num_ill = 0;

let num_newSick = 0;
let num_newDead = 0;

let death_number;
let sick_number;

let probability_vaccine_start = 0;

let epoch = 730;
let limit_time_illness = 21;
let limit_time_vaccine = 180;
let limit_time_immun_con = 180;

probability_immun_abs = 0.01;
probability_vaccine = 0.003;
probability_infect = 0.035;
probability_lethal = 0.001;
probability_virus_carrier = 1;
probability_start_sick = 0;

let sick_array = [];
let dead_array = [];
let recovered_array = [];
let vaccine_array = [];
let newSick_array = [];
let newDead_array = [];

const susceptible_array = [];

let x_values = [];

let exp_dead_array = [];

let xPercent_values = [0];

async function experiment() {
	await lifeCycle();

	const tag = document.getElementById('expPercent');

	tag.innerText = 'carantine: 0%';

	while (probability_virus_carrier > 0.05) {
		probability_virus_carrier -= 0.05;
		sick_array = [];
		dead_array = [];
		recovered_array = [];
		vaccine_array = [];
		newSick_array = [];
		newDead_array = [];
		x_values = [];

		dayCounter = 0;
		start_drawField();

		console.log(exp_dead_array);
		console.log(xPercent_values);

		let percent = 100 - probability_virus_carrier * 100;

		await lifeCycle();
		tag.innerText = 'carantine: ' + percent.toFixed(0) + '%';
		xPercent_values.push(percent.toFixed(0));
	}

	const chart = new Chart('expChart', {
		type: 'line',
		data: {
			labels: xPercent_values,
			datasets: [
				{
					data: exp_dead_array,
					borderColor: 'black',
					fill: false,
					label: 'dead',
				},
			],
		},

		options: { display: true },
		maintainAspectRatio: true,
	});
}

buttonStart.onclick = () => {
	isStart = !isStart;
	buttonStart.innerText = isStart ? 'Stop' : 'Start';

	experiment();
};

function sleep() {
	return new Promise((resolve) => {
		let intervalId = setInterval(() => {
			clearInterval(intervalId);
			resolve();
		}, 10);
	});
}

function init_arr() {
	let arr = new Array(size);
	for (let i = 0; i < arr.length; i++) {
		arr[i] = new Array(size);
	}

	return arr;
}

let mas = [{ state: 'HEALTH', vaccine_imm_time: -1, time_illness: -1 }];

let oldArrayField;
let newArrayField;

function generate_outside() {
	for (let i = 0; i < size; i++) {
		let el = { state: 'HEALTH', vaccine_imm_time: 0, time_illness: -1 };
		newArrayField[i][0] = {
			state: Math.random() < 0.02 ? 'SICK' : 'HEALTH',
			vaccine_imm_time: -1,
			time_illness: -1,
		};
		newArrayField[i][newArrayField.length - 1] = {
			state: Math.random() < 0.02 ? 'SICK' : 'HEALTH',
			vaccine_imm_time: -1,
			time_illness: -1,
		};
		newArrayField[0][i] = {
			state: Math.random() < 0.02 ? 'SICK' : 'HEALTH',
			vaccine_imm_time: 0,
			time_illness: -1,
		};
		newArrayField[newArrayField.length - 1][i] = {
			state: Math.random() < 0.02 ? 'SICK' : 'HEALTH',
			vaccine_imm_time: -1,
			time_illness: -1,
		};
	}
}

function start_generate() {
	for (let i = 1; i < size; i++) {
		for (let j = 1; j < size; j++) {
			newArrayField[i][j] = {
				state: Math.random() < probability_immun_abs ? 'ABS_IMM' : 'HEALTH',
				vaccine_imm_time: -1,
				abs_imm: Math.random() < probability_immun_abs,
				time_illness: -1,
			};
			if (newArrayField[i][j].state === 'HEALTH') {
				newArrayField[i][j] = {
					state: Math.random() < probability_vaccine_start ? 'VACCINE' : 'HEALTH',
					vaccine_imm_time: (Math.random() * 180).toFixed(0) % 180,
					abs_imm: Math.random() < probability_immun_abs,
					time_illness: -1,
					vaccine: false,
				};
			}
			if (newArrayField[i][j].state === 'HEALTH') {
				newArrayField[i][j] = {
					state: Math.random() < probability_start_sick ? 'SICK' : 'HEALTH',
					vaccine_imm_time: (Math.random() * 21).toFixed(0) % 21,
					abs_imm: Math.random() < probability_immun_abs,
					time_illness: -1,
				};
			}
			if (newArrayField[i][j].state === 'VACCINE') {
				newArrayField[i][j].vaccine = true;
			}
		}
	}
}

function check_cell(cell, neighbour, probability_virus_carrier) {
	if (cell.state === 'HEALTH') {
		if (neighbour.state === 'SICK' && cell.state === 'HEALTH') {
			cell.state =
				Math.random() > probability_virus_carrier * probability_infect ? 'HEALTH' : 'SICK';

			if (cell.state === 'SICK') {
				cell.time_illness = limit_time_illness;
				num_newSick++;
			}
		}
	}
}

function change_cell_state(i, j) {
	oldArrayField[i][j].vaccine_imm_time -= 1;
	oldArrayField[i][j].time_illness -= 1;
	cell = oldArrayField[i][j];

	if (cell.vaccine_imm_time === 0) {
		cell.state = 'HEALTH';

		cell.vaccine = false;
		return;
	}

	if (cell.state === 'HEALTH') {
		if (oldArrayField[i - 1][j])
			check_cell(newArrayField[i][j], oldArrayField[i - 1][j], probability_virus_carrier);
		if (oldArrayField[i][j + 1])
			check_cell(newArrayField[i][j], oldArrayField[i][j + 1], probability_virus_carrier);
		if (oldArrayField[i + 1][j])
			check_cell(newArrayField[i][j], oldArrayField[i + 1][j], probability_virus_carrier);
		if (oldArrayField[i][j - 1])
			check_cell(newArrayField[i][j], oldArrayField[i][j - 1], probability_virus_carrier);
		if (oldArrayField[i - 1][j + 1])
			check_cell(newArrayField[i][j], oldArrayField[i - 1][j + 1], probability_virus_carrier);
		if (oldArrayField[i + 1][j + 1])
			check_cell(newArrayField[i][j], oldArrayField[i + 1][j + 1], probability_virus_carrier);
		if (oldArrayField[i + 1][j - 1])
			check_cell(newArrayField[i][j], oldArrayField[i + 1][j - 1], probability_virus_carrier);
		if (oldArrayField[i - 1][j - 1])
			check_cell(newArrayField[i][j], oldArrayField[i - 1][j - 1], probability_virus_carrier);

		cell.state = Math.random() < probability_vaccine ? 'VACCINE' : cell.state;

		if (cell.state === 'VACCINE') {
			cell.vaccine_imm_time = 180;
			cell.vaccine = true;
		}

		return;
	}

	if (cell.state === 'SICK') {
		if (Math.random() < probability_lethal) {
			cell.state = 'DEAD';
			num_newDead++;
		}
		if (cell.time_illness === 0) {
			cell.vaccine_imm_time = limit_time_immun_con;
			cell.state = 'IMM';
		}
		return;
	}

	if (cell.state === 'IMM') {
		cell.state = Math.random() < probability_vaccine ? 'VACCINE' : cell.state;
		if (cell.state === 'VACCINE') {
			cell.vaccine_imm_time = 180;
			cell.vaccine = true;
		}
		return;
	}
}
function day_change() {
	num_dead = 0;
	num_sick = 0;
	num_imm = 0;
	num_vaccine = 0;
	num_newSick = 0;
	num_newDead = 0;
	num_recovered = 0;
	num_susceptible = 0;
	oldArrayField = [...newArrayField];

	for (let i = 1; i < size - 1; i++) {
		for (let j = 1; j < size - 1; j++) {
			change_cell_state(i, j, probability_virus_carrier);
			if (newArrayField[i][j].state === 'DEAD') num_dead++;
			if (newArrayField[i][j].state === 'SICK') num_sick++;
			if (newArrayField[i][j].state === 'IMM' || newArrayField[i][j].state === 'VACCINE') num_imm++;
			if (newArrayField[i][j].vaccine === true) num_vaccine++;
			if (newArrayField[i][j].state === 'HEALTH') num_susceptible++;
			if (newArrayField[i][j].state === 'IMM') num_recovered++;
		}
	}

	dead_array.push((num_dead * 100) / ((size - 1) * (size - 1)));
	sick_array.push((num_sick * 100) / ((size - 1) * (size - 1)));
	vaccine_array.push((num_vaccine * 100) / ((size - 1) * (size - 1)));
	susceptible_array.push((num_susceptible * 100) / ((size - 1) * (size - 1)));
	recovered_array.push((num_recovered * 100) / ((size - 1) * (size - 1)));
	newDead_array.push((num_newDead * 100) / ((size - 1) * (size - 1)));
	newSick_array.push((num_newSick * 100) / ((size - 1) * (size - 1)));
}

async function lifeCycle() {
	console.log(isStart);
	while (isStart && dayCounter < epoch) {
		generate_outside();
		day_change();

		await drawField(newArrayField);

		x_values.push(dayCounter + 1);
		await sleep();
		dayCounter++;
	}

	const chart1 = new Chart('myChart1', {
		type: 'line',
		data: {
			labels: x_values,
			datasets: [
				{
					data: newSick_array,
					borderColor: 'red',
					fill: false,
					label: 'illness',
				},
			],
		},
		options: {
			legend: { display: true },
			maintainAspectRatio: true,
		},
	});

	const chart = new Chart('myChart', {
		type: 'line',
		data: {
			labels: x_values,
			datasets: [
				{
					data: sick_array,
					borderColor: 'red',
					fill: false,
					label: 'illness',
				},
				{
					data: recovered_array,
					borderColor: 'blue',
					label: 'recovered',
					fill: false,
				},
				{
					data: susceptible_array,
					borderColor: 'green',
					fill: false,
					label: 'susceptible',
				},
				{
					data: vaccine_array,
					borderColor: 'purple',
					fill: false,
					label: 'vaccine',
				},
				{
					data: dead_array,
					borderColor: 'black',
					fill: false,
					label: 'dead',
				},
			],
		},
		options: {
			legend: { display: true },
			maintainAspectRatio: true,
		},
	});

	if (isStart) {
		exp_dead_array.push(Number((num_dead * 100) / ((size - 1) * (size - 1)).toFixed(2)));
		return Promise.resolve();
	} else return Promise.reject();
}

async function drawField(newArrayField) {
	ctx.clearRect(0, 0, 1000, 1000);
	ctx.strokeRect(0, 0, 1000, 1000);

	for (let i = 0; i < size; i++) {
		for (let j = 0; j < size; j++) {
			if (newArrayField && newArrayField[i][j]) {
				ctx.fillStyle = stateColors.get(newArrayField[i][j].state);
				ctx.fillRect((j * 1000) / size, (i * 1000) / size, 1000 / size, 1000 / size);
			}
		}
	}
	return Promise.resolve();
}

function start_drawField() {
	oldArrayField = init_arr();
	newArrayField = init_arr();
	start_generate();
	generate_outside();
	drawField(newArrayField);
}

start_drawField();
