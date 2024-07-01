import { format } from 'date-fns';

function match(o, table) {
  return (table[o.constructor.name] || table['_'])(o);
}

function CommemorativeDiscountNoTax(percentage, date) {
  this.percentage = percentage;
  this.date = date;
}

function FederalTax(percentage) {
  this.percentage = percentage;
}

function StateTax(percentage) {
  this.percentage = percentage;
}

function MunicipalTax(percentage) {
  this.percentage = percentage;
}

function And(a, b) {
  this.a = a;
  this.b = b;
}

function Or(a, b) {
  this.a = a;
  this.b = b;
}

function Item(x) {
  this.x = x;
}


// change this value to another date
// to this current day to apply the commemorative discount no tax.
const CommemorativeDate = '30-07-2024';

const taxesTree = new Or(
  new Item(new CommemorativeDiscountNoTax(0.05, CommemorativeDate)),
  new And(
    new Item(new FederalTax(0.1)),
    new And(
      new Item(new StateTax(0.04)),
      new Item(new MunicipalTax(0.02))
    )
  )
);

function applyTax(taxDescription, order) {
  return match(taxDescription, {
    CommemorativeDiscountNoTax: ({ date, percentage }) => {
      if (date !== format(new Date(), "dd-MM-yyyy")) {
	return [order, false];
      }
      order.applied.push(taxDescription);
      order.total -= order.price * percentage;
      return [order, true];
    },
    FederalTax: ({ percentage }) => {
      order.applied.push(taxDescription);
      order.total += order.price * percentage;
      return [order, true];
    },
    StateTax: ({ percentage }) => {
      order.applied.push(taxDescription);
      order.total += order.price * percentage;
      return [order, true];
    },
    MunicipalTax: ({ percentage }) => {
      order.applied.push(taxDescription);
      order.total += order.price * percentage;
      return [order, true];
    }
  });
}

function applyTaxRule(composition, order) {
  return match(composition, {
    And: ({ a, b }) => {
      const [o,] = applyTaxRule(a, order);
      return applyTaxRule(b, o);
    },
    Or: ({ a, b }) => {
      const [o, applied] = applyTaxRule(a, order);
      if (applied) {
	return [o, applied];
      }
      return applyTaxRule(b, order);
    },
    Item: ({ x }) => applyTax(x, order)
  });
}

const [order,] = applyTaxRule(taxesTree, { total: 100, price: 100, applied: [] });

console.log(`
Order summary
--------------------------------------------------------
Price: ${order.price}
${order.applied.reduce((acc, b) => `${acc}
${b.constructor.name}: ${b.percentage * 100}%`, "")}
--------------------------------------------------------
Total: ${order.total}
`)
