module.exports = class ValidatePassword {
  constructor(password) {
    this.password = password;
    this.errors = [];

    this.countStringRegex = new RegExp('^.{6,12}$');
    this.lowerCaseStringRegex = new RegExp('^(?=.*[a-z])');
    this.upperCaseStringRegex = new RegExp('^(?=.*[A-Z])');
    this.numberStringRegex = new RegExp('^(?=.*[0-9])');
    this.charStringRegex = new RegExp('^(?=.*[!@#$%^&*])');

    this.validade();
  }

  validade() {
    if (!this.countStringRegex.test(this.password)) {
      this.errors.push('A senha deve ter entre 6 e 12 caracteres.');
      return;
    }
    if (!this.lowerCaseStringRegex.test(this.password)) {
      this.errors.push('A senha deve conter pelo menos 1 caractere alfabético minúsculo.');
      return;
    }
    if (!this.upperCaseStringRegex.test(this.password)) {
      this.errors.push('A senha deve conter pelo menos 1 caractere alfabético maiúsculo.');
      return;
    }
    if (!this.numberStringRegex.test(this.password)) {
      this.errors.push('A senha deve conter pelo menos 1 caractere numérico.');
      return;
    }
    if (!this.charStringRegex.test(this.password)) {
      this.errors.push('A senha deve conter pelo menos um caractere especial. exemplo: !@#$%^&*');
      return;
    }
  }
};
