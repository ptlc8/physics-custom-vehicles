const Items = [
	{id:"waffle",attach:true,contain:true,density:.2},
	{id:"box+",attach:true,contain:true,density:.3}, // biscuit
	{id:"w+",rotate4attachable:true,density:.2,motorized:true,friction:3,attachType:"revolute",activable:true,needjointtoactivable:true}, // donut
	{id:"w-",rotate4attachable:true,density:.2,friction:1,linkD:.75,attachType:"revolute"},
	{id:"player",containable:true,density:.1}, // pain d'épice ? fraise des bois ?
	{id:"firework",attachable:true,rotate8:true,density:.2,activable:true},
	{id:"p",rotate4attachable:true,rotation4:true,density:.2,rotate4:true,linkD:.62,attachType:"default",activable:true,needjointtoactivable:true},
	{id:"balloon",attachable:true,gravityinverted:true,density:.35,attachType:"rope",colorable:true,colors:6,color:1}, // -350g
	// toaster
	{id:"weight",attachable:true,density:1.4,attachType:"rope"}, // 336g // cerise
	//parapluie
	{id:"pop",attachable:true,density:0.3,attachType:"default",activable:true,activableonce:true,containable:true},
	// ressort
	// corde // reglisse ?
	// axe de rotation (en mode pince)
];

Items.getItem = function(id) {
	for (let item of Items)
		if (item.id == id)
			return item;
}


if (typeof exports === 'object' && typeof module === 'object') {
	module.exports = Items;
}
