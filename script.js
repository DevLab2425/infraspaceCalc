window.InfraCalc = {
  buildingsSelect: document.getElementById("buildings"),
  resourcesSelect: document.getElementById("resources"),
  currentMode: 'rate', // or 'building'

  init: async (window) => {
    console.log('InfraCalc - init');
    
    window.buildings = await InfraCalc.loadBuildings();
    window.mapping = await InfraCalc.loadMapping();
    window.resources = await InfraCalc.loadResouces();

    InfraCalc.populateBuildingsSelect();
    InfraCalc.populateResourcesSelect();

    InfraCalc.applyListeners();

    document.getElementById("rate_amount").focus();
  },

  applyListeners: () => {
    console.log('applyListeners');
    
    document.getElementsByName("mode")
      .forEach(e => e.addEventListener("change", InfraCalc.toggleMode));
    document.getElementById('rate_form')
      .addEventListener('submit', InfraCalc.handleRateFormSubmit)
    document.getElementById('building_form')
      .addEventListener('submit', InfraCalc.handleBuildingFormSubmit)
  },

  toggleMode: (ev) => {
    const { target: { value } } = ev;

    document.getElementById("building_calculation").classList.toggle('active');
    document.getElementById("rate_calculation").classList.toggle('active');

    document.getElementById(`${value}_amount`).focus();

    InfraCalc.currentMode = value;
  },

  handleRateFormSubmit: (ev) => {
    console.log('submitting rate form');
    
    ev.preventDefault();
    
    InfraCalc.calculateResourceRate();
  },
  
  handleBuildingFormSubmit: (ev) => {
    console.log('submitting building form');
    
    ev.preventDefault();

    InfraCalc.calculateBuildingRequirements();
  },

  validateAmount: (amount, messageElement, table, message) => {
    if (!amount.checkValidity()) {
      messageElement.innerText = "aborting calculation due to bad input";
    } else {
      messageElement.innerText = message;
      table.innerHTML = "";
    }

    return amount.checkValidity();
  },

  sumRequiredItems(item, results) {
    let sum = 0;
    for (const i of results[item]) {
      sum += i;
    }
    return Math.round((sum + Number.EPSILON) * 100) / 100;
  },

  populateResults(resourceKey, table, results) {
    const ORGANIC_WASTE_BUILDINGS = "Vegetable Farm, Meat Lab or Food Factory";
    
    const { buildings, mapping, sumRequiredItems } = InfraCalc;
    
    const list = Object.keys(buildings).sort();
    const building = mapping[resourceKey];
    let html = "<tr><th>Building</th><th>Number required</th></tr>";

    html += `<tr><td>${buildings[building].building}</td><td>${sumRequiredItems(resourceKey, results)}</td><tr>`;

    for (const i of list) {
      const resource = buildings[i].output
      if (resource === resourceKey || !results.hasOwnProperty(resource)) {
        continue;
      }
      html += `<tr><td>${buildings[i].building}</td><td>${sumRequiredItems(resource, results)}</td><tr>`
    }

    if (results.hasOwnProperty(organicWaste)) {
      html += `<tr><td>${ORGANIC_WASTE_BUILDINGS}</td><td>${sumRequiredItems(organicWaste, results)}</td><tr>`
    }
    table.innerHTML = html;
  },

  iterateItemCosts(resourceKey, requiredRate) {
    const ORGANIC_WASTE = "organicWaste";
    const ORGANIC_RATE = 0.05;

    const { mapping } = InfraCalc;

    const results = {};

    const resourceList = [resourceKey];
    const rateList = [requiredRate];

    while (resourceList.length != 0) {
      const first = resourceList.shift();
      const workingRR = rateList.shift();

      // damned organicwaste - its a by product, you won't need to build prod buildings for it
      if (first !== ORGANIC_WASTE) {
        const building = data[mapping[first]];

        for (const [resource, amount] of Object.entries(building.inputs)) {
          const inputRate = (resource === ORGANIC_WASTE)? ORGANIC_RATE : data[mapping[resource]].rate;

          // required rate * ingredient amount  / building process time / ingredient production rate
          const nextRate = workingRR * amount / building.time / inputRate;

          resourceList.push(resource);
          rateList.push(nextRate);
        }
      }

      // add to results
      if (!results.hasOwnProperty(first)) {
        results[first] = [];
      }
      results[first].push(workingRR);
    }

    return results;
  },

  calculateResourceRate: () => {
    const { buildings, iterateItemCosts, mapping, populateResults, resources, resourcesSelect, validateAmount } = InfraCalc;

    const resourceKey = resourcesSelect.options[resourcesSelect.selectedIndex].value;
    const item = buildings[mapping[resourceKey]];

    const time_frame = [1, 60];

    const time = time_frame[document.getElementById("time_frame").selectedIndex];
    const amount = document.getElementById("rate_amount");
    const table = document.getElementById("rate_results");
    const messageElement = document.getElementById("rate_message");

    if (!validateAmount(amount, messageElement, table, "Required buildings for " + resources[resourceKey])) {
      return;
    }

    const requireRate = amount.value / time;
    const results = iterateItemCosts(resourceKey, requireRate / item.rate);

    populateResults(resourceKey, table, results);
  },

  calculateBuildingRequirements: () => {
    const { buildingsSelect, buildings: data, iterateItemCosts, populateResults, validateAmount } = InfraCalc;

    const buildingKey = buildingsSelect.options[buildingsSelect.selectedIndex].value;
    const item =  data[buildingKey];

    const amount = document.getElementById("building_amount")
    const table = document.getElementById("building_results");
    const messageElement = document.getElementById("building_message");

    const plural = amount.value > 1 ? "s" : "";
    const message = `Requirements to satisfy ${amount.value} ${item.building} building${plural} producing ${dataResources[item.output]}`
    if (!validateAmount(amount, messageElement, table, message)) {
      return;
    }

    const results = {};

    results = iterateItemCosts(item.output, parseInt(amount.value));
    populateResults(item.output, table, results);
  },

  populateBuildingsSelect: async () => {
    const data = await InfraCalc.loadBuildings();

    for (const build of Object.keys(data).sort()) {
      const opt = document.createElement("option");
      opt.text = data[build].building;
      opt.value = build;

      InfraCalc.buildingsSelect.options.add(opt);

      data[build].rate = data[build].output_val / data[build].time;
    }
  },

  populateResourcesSelect: async () => {
    const data = await InfraCalc.loadResouces();

    for (const resouce of Object.keys(data).sort()) {
      const opt = document.createElement("option");
      opt.text = data[resouce];
      opt.value = resouce;

      InfraCalc.resourcesSelect.options.add(opt);
    }
  },

  loadBuildings: async () => {
    console.log('loadBuildings');

    if(InfraCalc.buildings) return InfraCalc.buildings;

    try {
      // does the downloaded version exist?
      const response = await fetch('./data/buildings.json');
      InfraCalc.buildings = await response.json();
      
      return InfraCalc.buildings;
    } catch (ex) {
      // buildings.json most likely does not exist. 
      console.log('buildings.json not found. Falling back.');
      // use sample data
      try {
        const response = await fetch('./data/buildings-sample.json');
        InfraCalc.buildings = await response.json();
      
        return InfraCalc.buildings;
      } catch (ex) {
        console.log('buildings-sample.json not found. Cannot proceed');
        console.log({ex})
      }
    }
  }, 

  loadResouces: async () => {
    console.log('loadResources');

    if(InfraCalc.resources) return InfraCalc.resources;
    
    try {
      const response = await fetch('./data/resources.json');
      InfraCalc.resources = await response.json();

      return InfraCalc.resources;
    } catch (ex) {
      console.log('resources.json not found. Cannot proceed');
    }
  }, 

  loadMapping: async () => {
    console.log('loadResources');

    if(InfraCalc.mapping) return InfraCalc.mapping;
    
    try {
      const response = await fetch('./data/resource-building-map.json');
      InfraCalc.mapping = await response.json();

      return InfraCalc.mapping;
    } catch (ex) {
      console.log('resources.json not found. Cannot proceed');
    }
  }

}

window.addEventListener('load', async () => {
  window.InfraCalc.init(window);
});