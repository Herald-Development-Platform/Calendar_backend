const COLLEGEID_REGEX = new RegExp(
  /^np\d{2}((cs|bm|mb)[3-9])?[sma]\d{6}(@heraldcollege\.edu\.np)?$/
);

const TEACHER_EMAIL_REGEX = new RegExp(/^([a-z]+.[a-z]+)(@heraldcollege.edu.np)$/);

module.exports = {
  COLLEGEID_REGEX,
  TEACHER_EMAIL_REGEX,
};
