var resourcesSelect = document.getElementById("resources");
var buildingsSelect = document.getElementById("buildings");

window.addEventListener('load', (event) => {

  for (const res of Object.keys(dataResources).sort()) {
    var opt = document.createElement("option");
    opt.text = dataResources[res];
    opt.value = res;
    resourcesSelect.options.add(opt);
  }

  for (const build of Object.keys(data).sort()) {
    var opt = document.createElement("option");
    opt.text = data[build].building;
    opt.value = build;
    buildingsSelect.options.add(opt);

    data[build].rate = data[build].output_val / data[build].time;
  }

  document.getElementsByName("mode").forEach(e => e.addEventListener("change", toggleMode));
  document.getElementById('rate_form').addEventListener('submit', calculateResourceRate);
  document.getElementById('building_form').addEventListener('submit', calculateBuildingRequirements);

  document.getElementById("rate_amount").focus();
});

let time_frame = [1, 60];

function handleKeyPress(event) {
  if (event.key === "Enter") {
    var modes = document.getElementsByName("mode")

    if (modes[0].checked) {
      document.getElementById("calc_rate").click();
    } else {
      document.getElementById("calc_building").click();
    }
  }
}

function toggleMode(ev) {
  const { target: { value } } = ev;

  document.getElementById("building_calculation").classList.toggle('active');
  document.getElementById("rate_calculation").classList.toggle('active');

  document.getElementById(`${value}_amount`).focus();
}

function validateAmount(amount, messageElement, table, message) {
  if (!amount.checkValidity()) {
    messageElement.innerText = "aborting calculation due to bad input";
  } else {
    messageElement.innerText = message;
    table.innerHTML = "";
  }

  return amount.checkValidity();
}

function calculateBuildingRequirements(ev) {
  ev.preventDefault();

  var buildingKey = buildingsSelect.options[buildingsSelect.selectedIndex].value;
  var item =  data[buildingKey];

  var amount = document.getElementById("building_amount")
  var table = document.getElementById("building_results");
  var messageElement = document.getElementById("building_message");

  var plural = amount.value > 1 ? "s" : "";
  var message = `Requirements to satisfy ${amount.value} ${item.building} building${plural} producing ${dataResources[item.output]}`
  if (!validateAmount(amount, messageElement, table, message)) {
    return;
  }

  var results = {};

  results = iterateItemCosts(item.output, parseInt(amount.value));
  populateResults(item.output, table, results);
}

function calculateResourceRate(ev) {
  ev.preventDefault();

  var resourceKey = resourcesSelect.options[resourcesSelect.selectedIndex].value;
  var item = data[resourceBuildingMap[resourceKey]];

  var time = time_frame[document.getElementById("time_frame").selectedIndex];
  var amount = document.getElementById("rate_amount");
  var table = document.getElementById("rate_results");
  var messageElement = document.getElementById("rate_message");

  if (!validateAmount(amount, messageElement, table, "Required buildings for " + dataResources[resourceKey])) {
    return;
  }

  var requireRate = amount.value / time;
  var results = {};

  results = iterateItemCosts(resourceKey, requireRate / item.rate);
  populateResults(resourceKey, table, results);
}

function iterateItemCosts(resourceKey, requiredRate) {
  var results = {};

  var resourceList = [resourceKey];
  var rateList = [requiredRate];

  while (resourceList.length != 0) {
    var first = resourceList.shift();
    var workingRR = rateList.shift();

    // damned organicwaste - its a by product, you won't need to build prod buildings for it
    if (first !== organicWaste) {
      var building = data[resourceBuildingMap[first]];

      for (const [resource, amount] of Object.entries(building.inputs)) {
        var inputRate = (resource === organicWaste)? organiceRate : data[resourceBuildingMap[resource]].rate;

        // required rate * ingredient amount  / building process time / ingredient production rate
        var nextRate = workingRR * amount / building.time / inputRate;

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
}

function populateResults(resourceKey, table, results) {
  var list = Object.keys(data).sort();
  var building = resourceBuildingMap[resourceKey];
  var html = "<tr><th>Building</th><th>Number required</th></tr>";

  html += `<tr><td>${data[building].building}</td><td>${sumRequiredItems(resourceKey, results)}</td><tr>`;

  for (const i of list) {
    var resource = data[i].output
    if (resource === resourceKey || !results.hasOwnProperty(resource)) {
      continue;
    }
    html += `<tr><td>${data[i].building}</td><td>${sumRequiredItems(resource, results)}</td><tr>`
  }

  if (results.hasOwnProperty(organicWaste)) {
    html += `<tr><td>${organicWasteBuildings}</td><td>${sumRequiredItems(organicWaste, results)}</td><tr>`
  }
  table.innerHTML = html;
}

function sumRequiredItems(item, results) {
  var sum = 0;
  for (const i of results[item]) {
    sum += i;
  }
  return Math.round((sum + Number.EPSILON) * 100) / 100;
}

/*
now organic waste is used as input ingredients for several buildings
*/
let organicWaste = "organicWaste";
let organiceRate = 0.05;
let organicWasteBuildings = "Vegetable Farm, Meat Lab or Food Factory";

let dataResources = {
  "sand": "Sand",
  "sulfur": "Sulfur",
  "ironOre": "Iron Ore",
  "copperOre": "Copper Ore",
  "aluminium": "Aluminium",
  "uranium": "Uranium",
  "iridium": "Iridium",
  "concrete": "Concrete",
  "carbon": "Carbon",
  "water": "Water",
  "steel": "Steel",
  "copperBar": "Copper Bar",
  "crudeOil": "Crude Oil",
  "motor": "Motor",
  "electronics": "Electronics",
  "plastic": "Plastic",
  "homeAppliance": "Home Appliance",
  "microchip": "Microchip",
  "computer": "Computer",
  "industrialChemicals": "Industrial Chemicals",
  "nanotubes": "Nanotubes",
  "neuralProcessor": "Neural Processor",
  "sensor": "Sensor",
  "homeRobot": "Home Robot",
  "industrialRobot": "Industrial Robot",
  "reinforcedIridium": "Reinforced Iridium",
  "methane": "Methane",
  "highTechTool": "High Tech Tool",
  "holoDisplay": "Holo Display",
  "vrEdutainment": "Vr Edutainment",
  "heatExchanger": "Heat Exchanger",
  "superconductor": "Superconductor",
  "aiControlUnit": "Ai Control Unit",
  "enrichedUranium": "Enriched Uranium",
  "radiationCore": "Radiation Core",
  "sciencePack1": "Science Pack1",
  "chemicals": "Chemicals",
  "sciencePack2": "Science Pack2",
  "sciencePack3": "Science Pack3",
  "sciencePack4": "Science Pack4",
  "oxygen": "Oxygen",
  "survivalFood": "Survival Food",
  "fertilizer": "Fertilizer",
  "vegetables": "Vegetables",
  "stemCell": "Stem Cell",
  "meat": "Meat",
  "goodFood": "Good Food",
  "spaceshipModule": "Spaceship Module",
  "distilledWater": "Distilled Water",
  "adamantine": "Adamantine",
  "filteringMesh": "Filtering Mesh",
  "advancedFilteringMesh": "Advanced Filtering Mesh",
  "superconductingCoil": "Superconducting Coil"
};

let resourceBuildingMap = {
  "sand": "largeSandMine",
  "sulfur": "largeSulfurMine",
  "ironOre": "largeIronMine",
  "copperOre": "largeCopperMine",
  "aluminium": "largeAluminiumMine",
  "uranium": "largeUraniumMine",
  "iridium": "largeIridiumMine",
  "concrete": "concreteFactory",
  "steel": "steelMill",
  "motor": "motorFactory",
  "electronics": "electronicsFactory",
  "homeAppliance": "homeAppliancesFactory",
  "microchip": "microchipFactory",
  "computer": "computerFactory",
  "nanotubes": "nanotubesFactory",
  "neuralProcessor": "neuralProcessorFactory",
  "homeRobot": "homeRobotFactory",
  "industrialRobot": "industrialRobotFactory",
  "highTechTool": "highTechWorkshop",
  "vrEdutainment": "vrEdutainmentFactory",
  "reinforcedIridium": "reinforcedIridiumFactory",
  "holoDisplay": "holoDisplayFactory",
  "superconductor": "superconductorFactory",
  "aiControlUnit": "aiControlUnitFactory",
  "radiationCore": "radiationCoreFactory",
  "sciencePack1": "sciencePack1Factory",
  "sciencePack2": "sciencePack2Factory",
  "sciencePack3": "sciencePack3Factory",
  "sciencePack4": "sciencePack4Factory",
  "oxygen": "oxygenProcessor",
  "carbon": "carbonProcessor",
  "survivalFood": "basicFarm",
  "fertilizer": "fertilizerFactory",
  "vegetables": "vegetableFarm",
  "meat": "meatLab",
  "goodFood": "foodFactory",
  "spaceshipModule": "spaceShipConstructionFacility",
  "water": "waterWellHydraulic",
  "methane": "methaneFermentationPlant",
  "distilledWater": "waterDistillery",
  "adamantine": "monumentDrill_Stage4",
  "filteringMesh": "filteringMeshFactory",
  "advancedFilteringMesh": "advancedFilteringMeshFactory",
  "superconductingCoil": "superconductingCoilFactory",
  "crudeOil": "largeCrudeOilExtractor",
  "chemicals": "chemicalsLab",
  "industrialChemicals": "industrialChemicalsLab",
  "stemCell": "stemCellLab",
  "copperBar": "copperMill",
  "plastic": "plasticFactory",
  "sensor": "sensorFactory",
  "heatExchanger": "heatExchangerFactory",
  "enrichedUranium": "enrichedUraniumFactory"
};

let data = {
  "largeSandMine": {
    "building": "Large Sand Mine",
    "time": 5.0,
    "inputs": {},
    "output": "sand",
    "output_val": 2,
    "output_rate": 0.4
  },
  "largeSulfurMine": {
    "building": "Large Sulfur Mine",
    "time": 5.0,
    "inputs": {},
    "output": "sulfur",
    "output_val": 2,
    "output_rate": 0.4
  },
  "largeIronMine": {
    "building": "Large Iron Mine",
    "time": 5.0,
    "inputs": {},
    "output": "ironOre",
    "output_val": 2,
    "output_rate": 0.4
  },
  "largeCopperMine": {
    "building": "Large Copper Mine",
    "time": 5.0,
    "inputs": {},
    "output": "copperOre",
    "output_val": 2,
    "output_rate": 0.4
  },
  "largeAluminiumMine": {
    "building": "Large Aluminium Mine",
    "time": 10.0,
    "inputs": {},
    "output": "aluminium",
    "output_val": 2,
    "output_rate": 0.2
  },
  "largeUraniumMine": {
    "building": "Large Uranium Mine",
    "time": 20.0,
    "inputs": {},
    "output": "uranium",
    "output_val": 2,
    "output_rate": 0.1
  },
  "largeIridiumMine": {
    "building": "Large Iridium Mine",
    "time": 10.0,
    "inputs": {},
    "output": "iridium",
    "output_val": 2,
    "output_rate": 0.2
  },
  "concreteFactory": {
    "building": "Concrete Factory",
    "time": 10.0,
    "inputs": {
      "sulfur": 1,
      "sand": 1
    },
    "output": "concrete",
    "output_val": 5,
    "output_rate": 0.5
  },
  "steelMill": {
    "building": "Steel Mill",
    "time": 10.0,
    "inputs": {
      "ironOre": 1,
      "carbon": 1,
      "water": 1
    },
    "output": "steel",
    "output_val": 5,
    "output_rate": 0.5
  },
  "motorFactory": {
    "building": "Motor Factory",
    "time": 40.0,
    "inputs": {
      "copperBar": 2,
      "steel": 5,
      "crudeOil": 4
    },
    "output": "motor",
    "output_val": 4,
    "output_rate": 0.1
  },
  "electronicsFactory": {
    "building": "Electronics Factory",
    "time": 15.0,
    "inputs": {
      "ironOre": 2,
      "copperOre": 2
    },
    "output": "electronics",
    "output_val": 2,
    "output_rate": 0.13
  },
  "homeAppliancesFactory": {
    "building": "Home Appliances Factory",
    "time": 30.0,
    "inputs": {
      "electronics": 2,
      "plastic": 1
    },
    "output": "homeAppliance",
    "output_val": 3,
    "output_rate": 0.1
  },
  "microchipFactory": {
    "building": "Microchip Factory",
    "time": 30.0,
    "inputs": {
      "sand": 3,
      "electronics": 2
    },
    "output": "microchip",
    "output_val": 3,
    "output_rate": 0.1
  },
  "computerFactory": {
    "building": "Computer Factory",
    "time": 60.0,
    "inputs": {
      "plastic": 4,
      "microchip": 4,
      "aluminium": 3
    },
    "output": "computer",
    "output_val": 8,
    "output_rate": 0.13
  },
  "nanotubesFactory": {
    "building": "Nanotubes Factory",
    "time": 40.0,
    "inputs": {
      "industrialChemicals": 2,
      "carbon": 6
    },
    "output": "nanotubes",
    "output_val": 4,
    "output_rate": 0.1
  },
  "neuralProcessorFactory": {
    "building": "Neural Processor Factory",
    "time": 60.0,
    "inputs": {
      "nanotubes": 6,
      "microchip": 8
    },
    "output": "neuralProcessor",
    "output_val": 3,
    "output_rate": 0.05
  },
  "homeRobotFactory": {
    "building": "Home Robot Factory",
    "time": 60.0,
    "inputs": {
      "sensor": 4,
      "motor": 4,
      "neuralProcessor": 1
    },
    "output": "homeRobot",
    "output_val": 6,
    "output_rate": 0.1
  },
  "industrialRobotFactory": {
    "building": "Industrial Robot Factory",
    "time": 60.0,
    "inputs": {
      "sensor": 4,
      "motor": 4,
      "neuralProcessor": 1
    },
    "output": "industrialRobot",
    "output_val": 6,
    "output_rate": 0.1
  },
  "highTechWorkshop": {
    "building": "High Tech Workshop",
    "time": 60.0,
    "inputs": {
      "reinforcedIridium": 4,
      "nanotubes": 2,
      "sensor": 4,
      "methane": 2
    },
    "output": "highTechTool",
    "output_val": 6,
    "output_rate": 0.1
  },
  "vrEdutainmentFactory": {
    "building": "Vr Edutainment Factory",
    "time": 60.0,
    "inputs": {
      "neuralProcessor": 4,
      "holoDisplay": 8
    },
    "output": "vrEdutainment",
    "output_val": 6,
    "output_rate": 0.1
  },
  "reinforcedIridiumFactory": {
    "building": "Reinforced Iridium Factory",
    "time": 20.0,
    "inputs": {
      "iridium": 2,
      "industrialChemicals": 1,
      "crudeOil": 4
    },
    "output": "reinforcedIridium",
    "output_val": 2,
    "output_rate": 0.1
  },
  "holoDisplayFactory": {
    "building": "Holo Display Factory",
    "time": 30.0,
    "inputs": {
      "nanotubes": 2,
      "reinforcedIridium": 2,
      "sensor": 4
    },
    "output": "holoDisplay",
    "output_val": 2,
    "output_rate": 0.07
  },
  "superconductorFactory": {
    "building": "Superconductor Factory",
    "time": 60.0,
    "inputs": {
      "iridium": 6,
      "sulfur": 10,
      "heatExchanger": 8
    },
    "output": "superconductor",
    "output_val": 2,
    "output_rate": 0.03
  },
  "aiControlUnitFactory": {
    "building": "Ai Control Unit Factory",
    "time": 120.0,
    "inputs": {
      "sensor": 10,
      "neuralProcessor": 6,
      "methane": 8
    },
    "output": "aiControlUnit",
    "output_val": 4,
    "output_rate": 0.03
  },
  "radiationCoreFactory": {
    "building": "Radiation Core Factory",
    "time": 120.0,
    "inputs": {
      "reinforcedIridium": 8,
      "enrichedUranium": 10
    },
    "output": "radiationCore",
    "output_val": 8,
    "output_rate": 0.07
  },
  "sciencePack1Factory": {
    "building": "Science Pack1 Factory",
    "time": 15.0,
    "inputs": {
      "crudeOil": 2,
      "carbon": 1
    },
    "output": "sciencePack1",
    "output_val": 1,
    "output_rate": 0.07
  },
  "sciencePack2Factory": {
    "building": "Science Pack2 Factory",
    "time": 30.0,
    "inputs": {
      "sand": 2,
      "chemicals": 4,
      "aluminium": 1,
      "sciencePack1": 2
    },
    "output": "sciencePack2",
    "output_val": 1,
    "output_rate": 0.03
  },
  "sciencePack3Factory": {
    "building": "Science Pack3 Factory",
    "time": 60.0,
    "inputs": {
      "motor": 4,
      "organicWaste": 2,
      "methane": 4,
      "sciencePack2": 3
    },
    "output": "sciencePack3",
    "output_val": 1,
    "output_rate": 0.02
  },
  "sciencePack4Factory": {
    "building": "Science Pack4 Factory",
    "time": 120.0,
    "inputs": {
      "aiControlUnit": 3,
      "radiationCore": 6,
      "sciencePack3": 4
    },
    "output": "sciencePack4",
    "output_val": 1,
    "output_rate": 0.01
  },
  "oxygenProcessor": {
    "building": "Oxygen Processor",
    "time": 10.0,
    "inputs": {},
    "output": "oxygen",
    "output_val": 2,
    "output_rate": 0.2
  },
  "carbonProcessor": {
    "building": "Carbon Processor",
    "time": 10.0,
    "inputs": {},
    "output": "carbon",
    "output_val": 2,
    "output_rate": 0.2
  },
  "basicFarm": {
    "building": "Basic Farm",
    "time": 10.0,
    "inputs": {
      "water": 1
    },
    "output": "survivalFood",
    "output_val": 1,
    "output_rate": 0.1
  },
  "fertilizerFactory": {
    "building": "Fertilizer Factory",
    "time": 20.0,
    "inputs": {
      "sulfur": 2,
      "chemicals": 2
    },
    "output": "fertilizer",
    "output_val": 2,
    "output_rate": 0.1
  },
  "vegetableFarm": {
    "building": "Vegetable Farm",
    "time": 40.0,
    "inputs": {
      "fertilizer": 2,
      "water": 3,
      "oxygen": 1
    },
    "output": "vegetables",
    "output_val": 6,
    "output_rate": 0.15
  },
  "meatLab": {
    "building": "Meat Lab",
    "time": 40.0,
    "inputs": {
      "water": 3,
      "stemCell": 2
    },
    "output": "meat",
    "output_val": 6,
    "output_rate": 0.15
  },
  "foodFactory": {
    "building": "Food Factory",
    "time": 20.0,
    "inputs": {
      "vegetables": 3,
      "meat": 3
    },
    "output": "goodFood",
    "output_val": 3,
    "output_rate": 0.15
  },
  "spaceShipConstructionFacility": {
    "building": "Space Ship Construction Facility",
    "time": 60.0,
    "inputs": {},
    "output": "spaceshipModule",
    "output_val": 1,
    "output_rate": 0.02
  },
  "nuclearPowerPlant": {
    "building": "Nuclear Power Plant",
    "time": 180.0,
    "inputs": {
      "uranium": 10,
      "water": 15
    }
  },
  "fastNeutronReactor": {
    "building": "Fast Neutron Reactor",
    "time": 500.0,
    "inputs": {
      "enrichedUranium": 50,
      "water": 25
    }
  },
  "waterAirFilter": {
    "building": "Water Air Filter",
    "time": 5.0,
    "inputs": {},
    "output": "water",
    "output_val": 1,
    "output_rate": 0.2
  },
  "waterWellHydraulic": {
    "building": "Water Well Hydraulic",
    "time": 10.0,
    "inputs": {},
    "output": "water",
    "output_val": 5,
    "output_rate": 0.5
  },
  "methaneDrill": {
    "building": "Methane Drill",
    "time": 10.0,
    "inputs": {},
    "output": "methane",
    "output_val": 1,
    "output_rate": 0.1
  },
  "methaneFermentationPlant": {
    "building": "Methane Fermentation Plant",
    "time": 15.0,
    "inputs": {
      "organicWaste": 2
    },
    "output": "methane",
    "output_val": 2,
    "output_rate": 0.13
  },
  "methanePowerPlant": {
    "building": "Methane Power Plant",
    "time": 60.0,
    "inputs": {
      "methane": 10
    }
  },
  "waterDistillery": {
    "building": "Water Distillery",
    "time": 10.0,
    "inputs": {
      "water": 5
    },
    "output": "distilledWater",
    "output_val": 2,
    "output_rate": 0.2
  },
  "monumentDrill_Stage4": {
    "building": "Monument Drill_ Stage4",
    "time": 240.0,
    "inputs": {
      "sciencePack4": 4,
      "superconductor": 16,
      "methane": 35
    },
    "output": "adamantine",
    "output_val": 10,
    "output_rate": 0.04
  },
  "filteringMeshFactory": {
    "building": "Filtering Mesh Factory",
    "time": 60.0,
    "inputs": {
      "heatExchanger": 2,
      "neuralProcessor": 1
    },
    "output": "filteringMesh",
    "output_val": 4,
    "output_rate": 0.07
  },
  "advancedFilteringMeshFactory": {
    "building": "Advanced Filtering Mesh Factory",
    "time": 120.0,
    "inputs": {
      "sciencePack2": 2,
      "aiControlUnit": 2,
      "filteringMesh": 6
    },
    "output": "advancedFilteringMesh",
    "output_val": 2,
    "output_rate": 0.02
  },
  "superconductingCoilFactory": {
    "building": "Superconducting Coil Factory",
    "time": 60.0,
    "inputs": {
      "superconductor": 2,
      "radiationCore": 4
    },
    "output": "superconductingCoil",
    "output_val": 1,
    "output_rate": 0.02
  },
  "dustParticleFilter": {
    "building": "Dust Particle Filter",
    "time": 60.0,
    "inputs": {
      "filteringMesh": 2
    }
  },
  "fertilizerDroneHub": {
    "building": "Fertilizer Drone Hub",
    "time": 60.0,
    "inputs": {
      "fertilizer": 8
    }
  },
  "groundAcidityRegulator": {
    "building": "Ground Acidity Regulator",
    "time": 120.0,
    "inputs": {
      "advancedFilteringMesh": 1
    }
  },
  "ammoniaExtractor": {
    "building": "Ammonia Extractor",
    "time": 120.0,
    "inputs": {
      "advancedFilteringMesh": 3
    }
  },
  "magneticFieldGenerator_Stage4": {
    "building": "Magnetic Field Generator_ Stage4",
    "time": 300.0,
    "inputs": {
      "superconductingCoil": 10,
      "sciencePack4": 2
    }
  },
  "largeCrudeOilExtractor": {
    "building": "Large Crude Oil Extractor",
    "time": 5.0,
    "inputs": {},
    "output": "crudeOil",
    "output_val": 2,
    "output_rate": 0.4
  },
  "chemicalsLab": {
    "building": "Chemicals Lab",
    "time": 10.0,
    "inputs": {},
    "output": "chemicals",
    "output_val": 2,
    "output_rate": 0.2
  },
  "industrialChemicalsLab": {
    "building": "Industrial Chemicals Lab",
    "time": 20.0,
    "inputs": {
      "distilledWater": 2,
      "chemicals": 4,
      "methane": 2
    },
    "output": "industrialChemicals",
    "output_val": 2,
    "output_rate": 0.1
  },
  "stemCellLab": {
    "building": "Stem Cell Lab",
    "time": 20.0,
    "inputs": {
      "oxygen": 2,
      "chemicals": 2
    },
    "output": "stemCell",
    "output_val": 2,
    "output_rate": 0.1
  },
  "copperMill": {
    "building": "Copper Mill",
    "time": 20.0,
    "inputs": {
      "copperOre": 2,
      "chemicals": 2
    },
    "output": "copperBar",
    "output_val": 2,
    "output_rate": 0.1
  },
  "plasticFactory": {
    "building": "Plastic Factory",
    "time": 15.0,
    "inputs": {
      "crudeOil": 2
    },
    "output": "plastic",
    "output_val": 2,
    "output_rate": 0.13
  },
  "sensorFactory": {
    "building": "Sensor Factory",
    "time": 30.0,
    "inputs": {
      "plastic": 4,
      "aluminium": 4
    },
    "output": "sensor",
    "output_val": 6,
    "output_rate": 0.2
  },
  "heatExchangerFactory": {
    "building": "Heat Exchanger Factory",
    "time": 40.0,
    "inputs": {
      "copperBar": 2,
      "steel": 5,
      "industrialChemicals": 2,
      "crudeOil": 4
    },
    "output": "heatExchanger",
    "output_val": 4,
    "output_rate": 0.1
  },
  "enrichedUraniumFactory": {
    "building": "Enriched Uranium Factory",
    "time": 60.0,
    "inputs": {
      "uranium": 4,
      "chemicals": 8
    },
    "output": "enrichedUranium",
    "output_val": 5,
    "output_rate": 0.08
  }
};
