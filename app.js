// BUDGET CONTROLLER
var budgetController = (() => {
  var data = {
    allItems: {
      exp: [],
      inc: [],
    },

    totals: {
      exp: 0,
      inc: 0,
    },

    budget: 0,
    percentage: -1,
  };

  class Expense {
    constructor(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
      this.percentage = -1;
    }

    calcPercentage(totalIncome) {
      if (totalIncome > 0) {
        this.percentage = Math.round((this.value / totalIncome) * 100);
      } else {
        this.percentage = -1;
      }
    }

    getPercentage() {
      return this.percentage;
    }
  }

  class Income {
    constructor(id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
    }
  }

  function calculateTotal(type) {
    var sum = 0;
    data.allItems[type].forEach((curr) => {
      sum += curr.value;
    });

    data.totals[type] = sum;
  }

  function addToLocalStorage(item, type) {
    let typeArray;
    if (localStorage.getItem(type) === null) {
      typeArray = [];
    } else {
      typeArray = JSON.parse(localStorage.getItem(type));
    }
    typeArray.push(item);
    localStorage.setItem(type, JSON.stringify(typeArray));
  }

  return {
    data,
    // Uses Income and Expense function constructor
    addItem: function (type, des, val) {
      var newItem, ID;
      // create new ID
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // create new item based on 'inc' or 'exp' type
      if (type === "exp") {
        newItem = new Expense(ID, des, val);
        addToLocalStorage(newItem, "exp");
      } else if (type == "inc") {
        newItem = new Income(ID, des, val);
        addToLocalStorage(newItem, "inc");
      }
      // push it onto our data structure
      data.allItems[type].push(newItem);
      // return the new element
      return newItem;
    },
    calculatePercentages: function () {
      data.allItems["exp"].forEach((curr) => {
        curr.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function () {
      var allPerc = data.allItems["exp"].map((curr) => {
        return curr.getPercentage();
      });

      return allPerc;
    },
    calculateBudget: function () {
      // Calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");
      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;
      // Calculate the percentage of income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },
    // Used after calculateBudget() which updates the information
    getBudget: function () {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage,
      };
    },
    deleteItem: function (type, id) {
      var ids, index;
      ids = data.allItems[type].map((current) => {
        return current.id;
      });

      index = ids.indexOf(id);

      if (index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },
    deleteItemFromLS(type, id) {
      let inputs = JSON.parse(localStorage.getItem(type));
      inputs.forEach((curr, index) => {
        if (curr.id === id) {
          inputs.splice(index, 1);
        }
      });

      localStorage.setItem(type, JSON.stringify(inputs));
    },
    createExpense(id, desc, value) {
      return new Expense(id, desc, value);
    },
  };
})();

// UI CONTROLLER
var UIController = (function () {
  var formatNumber = function (num, type) {
    var numSplit, int, dec, transformedInt;
    num = num.toFixed(2);
    numSplit = num.split(".");

    int = numSplit[0];
    // Will be overwritten if its length is greater than 3
    transformedInt = int;

    if (int.length > 3) {
      var startIdx = int.length % 3;
      transformedInt = int.substr(0, startIdx);

      do {
        if (startIdx != 0) transformedInt += ",";
        transformedInt += int.substr(startIdx, 3);
        startIdx += 3;
      } while (startIdx != int.length);
    }

    dec = numSplit[1];

    // return string
    return (type == "exp" ? "-" : "+") + " " + transformedInt + "." + dec;
  };

  var DOMstrings = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expenseContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expenseLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expensesPercentageLabel: ".item__percentage",
    dateLabel: ".budget__title--month",
  };

  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    formatNumber,
    getDOMstrings: function () {
      return DOMstrings;
    },

    getInput: function () {
      return {
        type: document.querySelector(DOMstrings.inputType).value, // will be either inc or exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
      };
    },

    // Adds the expense or income value on the user interface
    addListItem: function (obj, type) {
      var html, newHtml, element;
      // create HTML string with placeholder text
      if (type === "inc") {
        element = DOMstrings.incomeContainer;
        html =
          '<div class="item clearfix" id="inc-%id%"> <div class="item__description" >%description%</div ><div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div> </div></div >';
      } else if (type == "exp") {
        element = DOMstrings.expenseContainer;
        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div> <div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"> <i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value, type));
      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },

    deleteListItem: function (selectorID) {
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);
    },

    clearFields: function () {
      var field, fieldsArray;

      field = document.querySelectorAll(
        DOMstrings.inputDescription + "," + DOMstrings.inputValue
      );

      fieldsArr = Array.prototype.slice.call(field);
      fieldsArr.forEach(function (current, index, array) {
        current.value = "";
      });

      fieldsArr[0].focus();
    },
    // Updates budget on user interface
    displayBudget: function (obj) {
      var type;
      obj.budget > 0 ? (type = "inc") : (type = "exp");
      (document.querySelector(
        DOMstrings.budgetLabel
      ).textContent = formatNumber(obj.budget, type)),
        (document.querySelector(
          DOMstrings.incomeLabel
        ).textContent = formatNumber(obj.totalInc, "inc")),
        (document.querySelector(
          DOMstrings.expenseLabel
        ).textContent = formatNumber(obj.totalExp, "exp"));

      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent =
          obj.percentage + "%";
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = "---";
      }
    },

    displayPercentages: function (percentages) {
      // Creates a node list
      var fields = document.querySelectorAll(
        DOMstrings.expensesPercentageLabel
      );

      nodeListForEach(fields, function (current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      });
    },

    displayMonth: function () {
      var now, months, currentMonth, year;
      months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      now = new Date();
      currentMonth = now.getMonth();
      year = now.getFullYear();

      document.querySelector(DOMstrings.dateLabel).textContent =
        months[currentMonth] + " " + year;
    },

    changedType: function () {
      var fields = document.querySelectorAll(
        DOMstrings.inputType +
          "," +
          DOMstrings.inputDescription +
          "," +
          DOMstrings.inputValue
      );

      nodeListForEach(fields, function (curr) {
        curr.classList.toggle("red-focus");
      });

      document.querySelector(DOMstrings.inputBtn).classList.toggle("red");
    },
  };
})();

// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {
  // Non-functions
  function setupEventListeners() {
    var DOM = UICtrl.getDOMstrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function (event) {
      if (event.key === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    document
      .querySelector(DOM.container)
      .addEventListener("click", ctrlDeleteItem);

    document
      .querySelector(DOM.inputType)
      .addEventListener("change", UICtrl.changedType);
  }

  // Updates the budget both on user interface and backend
  function updateBudget() {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();
    // 2. Return the budget
    var budget = budgetCtrl.getBudget();
    // 3. Display the budget
    UICtrl.displayBudget(budget);
  }

  function updatePercentages() {
    // 1. Calculate the percentages
    budgetCtrl.calculatePercentages();
    // 2. Read the percentages
    var percentages = budgetCtrl.getPercentages();
    // 3. Update the UI with new percentages
    UICtrl.displayPercentages(percentages);
  }
  // Adds new item to both user interface and backend
  function ctrlAddItem() {
    var input, newItem;
    // 1. Get the filled input data
    input = UIController.getInput();

    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // 2. Add the item to the budget controller
      newItem = budgetController.addItem(
        input.type,
        input.description,
        input.value
      );
      // 3. Add the new item to the UI
      UICtrl.addListItem(newItem, input.type);
      // 4. Clear the fields
      UICtrl.clearFields();
      // 5. Calculate and update budget
      updateBudget();
      // 6. Update percentages
      updatePercentages();
    }
  }

  function ctrlAddItemFromLS(item, type) {
    // 1. Add the new item to Budget controller
    budgetCtrl.data.allItems[type].push(item);
    // 2. Add the new item to the UI
    UICtrl.addListItem(item, type);
    // 3. Calculate and update budget
    updateBudget();
    // 4. Update percentages
    updatePercentages();
  }

  function ctrlDeleteItem(event) {
    var itemID, splitID, type, ID;
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemID) {
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);
      // 2. Delete the item from the UI
      UICtrl.deleteListItem(itemID);
      // 3. Delete the item from local storage
      budgetCtrl.deleteItemFromLS(type, ID);
      // 4. Update and show the new budget
      updateBudget();
      // 5. Update percentages
      updatePercentages();
    }
  }

  function displayPreviousInputs() {
    let inputs;
    // Add the inc from local storage
    if (localStorage.getItem("inc") !== null) {
      inputs = JSON.parse(localStorage.getItem("inc"));
      inputs.forEach((currentInc) => {
        ctrlAddItemFromLS(currentInc, "inc");
      });
    }

    if (localStorage.getItem("exp") !== null) {
      inputs = JSON.parse(localStorage.getItem("exp"));
      inputs.forEach((curr) => {
        let newExpense = budgetCtrl.createExpense(
          curr.id,
          curr.description,
          curr.value
        );
        ctrlAddItemFromLS(newExpense, "exp");
      });
    }
  }

  return {
    init: function () {
      console.log("Application has started.");
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0,
      });

      setupEventListeners();
      displayPreviousInputs();
    },
  };
})(budgetController, UIController);

controller.init();
