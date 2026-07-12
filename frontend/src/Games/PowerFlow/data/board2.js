// Második pálya
export default {
    id: 2,
    optimalRotations: 10,
    grid: [
      [{
      type: "corner",
      rotation: 180,
      rotatable: true,
    },
    {
      type: "straight",
      rotation: 0,
      rotatable: true,
    },
    {
      type: "straight",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "corner",
      rotation: 180,
      rotatable: true,
    },
    {
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "empty",
      rotation: 0,
      rotatable: false,
    },],

    [{
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "corner",
      rotation: 180,
      rotatable: true,
    },
    {
      type: "straight",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "tee",
      rotation: 270,
      rotatable: true,
    },{
      type: "battery-end",
      rotation: 0,
      rotatable: false,
    },{
      type: "corner",
      rotation: 180,
      rotatable: true,
    }],

    [{
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "straight",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "corner",
      rotation: 180,
      rotatable: true,
    },{
      type: "straight",
      rotation: 90,
      rotatable: true,
    },{
      type: "empty",
      rotation: 0,
      rotatable: false,
    }],

    [{
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "corner",
      rotation: 180,
      rotatable: true,
    },
    {
      type: "straight",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "tee",
      rotation: 270,
      rotatable: true,
    },{
      type: "corner",
      rotation: 180,
      rotatable: true,
    },{
      type: "empty",
      rotation: 0,
      rotatable: false,
    }],

    [{
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "corner",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "straight",
      rotation: 90,
      rotatable: true,
    },
    {
      type: "tee",
      rotation: 270,
      rotatable: true,
    },{
      type: "corner",
      rotation: 180,
      rotatable: true,
    },{
      type: "empty",
      rotation: 0,
      rotatable: false,
    }],

    [{
      type: "battery-start",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "corner",
      rotation: 0,
      rotatable: true,
    },
    {
      type: "empty",
      rotation: 0,
      rotatable: false,
    },
    {
      type: "empty",
      rotation: 0,
      rotatable: false,
    },{
      type: "empty",
      rotation: 0,
      rotatable: false,
    },{
      type: "empty",
      rotation: 0,
      rotatable: false,
    }]
  ]
}