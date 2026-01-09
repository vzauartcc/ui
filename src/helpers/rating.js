export const ratingsShort = [
	'Unknown',
	'OBS',
	'S1',
	'S2',
	'S3',
	'C1',
	'C2',
	'C3',
	'I1',
	'I2',
	'I3',
	'SUP',
	'ADM',
];

export const ratingsLong = [
	'Unknown',
	'Observer',
	'Student',
	'Student 2',
	'Senior Student',
	'Controller',
	'Controller 2',
	'Senior Controller',
	'Instructor',
	'Instructor 2',
	'Senior Instructor',
	'Supervisor',
	'Administrator',
];

export const getRatingShort = (idx) => {
	return ratingsShort[idx];
};

export const getRatingLong = (idx) => {
	return ratingsLong[idx];
};
