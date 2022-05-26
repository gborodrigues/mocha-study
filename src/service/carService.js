const BaseRespository = require('../repository/base/baseRepository');
const Tax = require('../entities/tax');
const Transaction = require('../entities/transaction');

class CarService {
  constructor({ cars }) {
    this.carRepository = new BaseRespository({ file: cars });
    this.taxesBasedOnAge = Tax.taxesBasedOnAge;
    this.currencyFormat = new Intl.NumberFormat('pt-br', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  getRandomPositionFromArray(list) {
    const listLength = list.length;
    return Math.floor(Math.random() * listLength);
  }

  chooseRandomCar(carCategory) {
    const randomCarIndex = this.getRandomPositionFromArray(carCategory.carIds);
    return carCategory.carIds[randomCarIndex];
  }

  async getAvailableCar(carCategory) {
    const carId = this.chooseRandomCar(carCategory);
    const car = await this.carRepository.find(carId);
    return car;
  }

  calculateFinalPrice(customer, carCategory, numberOfDays) {
    const { age } = customer;
    const { price } = carCategory;
    const { then } = this.taxesBasedOnAge.find(
      tax => age >= tax.from && age <= tax.to,
    );
    const finalPrice = then * price * numberOfDays;
    return this.currencyFormat.format(finalPrice);
  }

  async rent(customer, carCategory, numberOfDays) {
    const [car, finalPrice] = await Promise.all([
      this.getAvailableCar(carCategory),
      this.calculateFinalPrice(customer, carCategory, numberOfDays),
    ]);
    const today = new Date();
    today.setDate(today.getDate() + numberOfDays);
    const dueDate = today.toLocaleDateString('pt-br', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const transaction = new Transaction({
      customer,
      dueDate,
      car,
      amount: finalPrice,
    });
    return transaction;
  }
}

module.exports = CarService;
