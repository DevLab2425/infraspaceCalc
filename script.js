window.InfraCalc = {
  buildingsSelect: document.getElementById("buildings"),
  resourcesSelect: document.getElementById("resources"),
  currentMode: 'rate', // or 'building'

  init: async (window) => {
    console.log('InfraCalc - init');
    
    window.buildings = await InfraCalc.loadBuildings();
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
      .addEventListener('submit', InfraCalc.handleRateSubmit)
  },

  toggleMode: (ev) => {
    const { target: { value } } = ev;

    document.getElementById("building_calculation").classList.toggle('active');
    document.getElementById("rate_calculation").classList.toggle('active');

    document.getElementById(`${value}_amount`).focus();

    InfraCalc.currentMode = value;
  },

  handleRateSubmit: (ev) => {
    ev.preventDefault();

    // InfraCalc.calculateResourceRate();
  },

  calculateResourceRate: () => {
    const { buildings, resourcesSelect } = InfraCalc;

    const resourceKey = resourcesSelect.options[resourcesSelect.selectedIndex].value;
    const item = buildings[resourceBuildingMap[resourceKey]];

    const time = time_frame[document.getElementById("time_frame").selectedIndex];
    const amount = document.getElementById("rate_amount");
    const table = document.getElementById("rate_results");
    const messageElement = document.getElementById("rate_message");

    if (!validateAmount(amount, messageElement, table, "Required buildings for " + dataResources[resourceKey])) {
      return;
    }

    const requireRate = amount.value / time;
    const results = {};

    results = iterateItemCosts(resourceKey, requireRate / item.rate);
    populateResults(resourceKey, table, results);
  },

  populateBuildingsSelect: () => {
    const data = window.buildings;

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
      var opt = document.createElement("option");
      opt.text = data[resouce];
      opt.value = resouce;

      InfraCalc.resourcesSelect.options.add(opt);
    }
  },

  loadBuildings: async () => {
    try {
      // does the downloaded version exist?
      const response = await fetch('./data/buildings.json');
      return await response.json();
    } catch (ex) {
      // buildings.json most likely does not exist. 
      console.log('buildings.json not found. Falling back.');
      // use sample data
      try {
        const response = await fetch('./data/buildings-sample.json');
        return await response.json();
      } catch (ex) {
        console.log('buildings-sample.json not found. Cannot proceed');
        console.log({ex})
      }
    }
  }, 

  loadResouces: async () => {
    console.log('loadResources');
    
    try {
      const response = await fetch('./data/resources.json');
      return await response.json();
    } catch (ex) {
      console.log('resources.json not found. Cannot proceed');
    }
  }, 

}

window.addEventListener('load', async () => {
  window.InfraCalc.init(window);
});