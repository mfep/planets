var globalRng = new Math.seedrandom(100);

function cappedLine(p1, p2, offset)
{
    p1 = new Point(p1);
    p2 = new Point(p2);
    var path = new Path();
    var length = (p2 - p1).length;
    var dp = (p2 - p1).normalize();
    var dt = new Point(-dp.y, dp.x);
    path.moveTo(p1 + dt * offset);
    path.lineBy(dp * length);
    path.arcBy(-dt * offset * 2, false);
    path.lineBy(-dp * length);
    path.arcBy(dt * offset * 2, false);
    return path;
}

function createRow(y, xstart, xend, layerSettings)
{
    var rng = new Math.seedrandom(globalRng());
    var width = xend - xstart;
    var dx = width / layerSettings.horizontalFreq;
    var orderedCenters = [];
    var randomCenters = [];
    for (var i = 0.5; i < layerSettings.horizontalFreq; ++i)
    {
        orderedCenters.push(xstart + i * dx);
        randomCenters.push(xstart + width * rng());
    }
    randomCenters.sort()
    var path = new Path();
    for (var i = 0; i < layerSettings.horizontalFreq; ++i)
    {
        if (rng() > layerSettings.horizontalProbability)
        {
            continue;
        }
        var interpolatedCenter = orderedCenters[i] * (1 - layerSettings.horizontalRandomness) + randomCenters[i] * layerSettings.horizontalRandomness;
        var p1 = new Point(interpolatedCenter - layerSettings.horizontalWidth / 2, y);
        var p2 = new Point(interpolatedCenter + layerSettings.horizontalWidth / 2, y);
        path = path.unite(cappedLine(p1, p2, layerSettings.lineWidth));
    }
    return path;
}

function createLayer(drawArea, layerSettings)
{
    var rng = new Math.seedrandom(1151);
    var path = new CompoundPath();
    var laneOffset = drawArea.height / layerSettings.laneCount;
    for (var laneIndex = 0; laneIndex < layerSettings.laneCount; ++laneIndex)
    {
        if (rng() > layerSettings.laneProbability)
        {
            continue;
        }
        var y = drawArea.top + (laneIndex + 0.5) * laneOffset;
        path.addChild(createRow(y, drawArea.left, drawArea.right, layerSettings));
    }
    return path;
}

var LayerSetting = function()
{
    this.solidColor = '#90EE90';
    this.laneCount = 10;
    this.lineWidth = 5;
    this.laneProbability = 1;
    this.horizontalFreq = 10;
    this.horizontalProbability = 0.8;
    this.horizontalWidth = 1;
    this.horizontalRandomness = 0.2;
};

function render()
{
    project.clear();
    var planetBase = new Path.Circle(drawArea.center, drawArea.width/2);
    planetBase.fillColor = globalSettings.baseColor;
    layerSettings.forEach(function(layerSetting)
    {
        var layer = createLayer(drawArea, layerSetting);
        layer = planetBase.intersect(layer);
        layer.fillColor = layerSetting.solidColor;
    })
}

function addLayerGui(gui, layerSetting, name)
{
    var f = gui.addFolder(name);
    f.addColor(layerSetting, 'solidColor').onFinishChange(render);
    f.add(layerSetting, 'laneCount', 1, 30).onFinishChange(render);
    f.add(layerSetting, 'lineWidth', 1, 15).onFinishChange(render);
    f.add(layerSetting, 'laneProbability', 0, 1).onFinishChange(render);
    f.add(layerSetting, 'horizontalFreq', 1, 50).onFinishChange(render);
    f.add(layerSetting, 'horizontalProbability', 0, 1).onFinishChange(render);
    f.add(layerSetting, 'horizontalWidth', 1, 100).onFinishChange(render);
    f.add(layerSetting, 'horizontalRandomness', 0, 1).onFinishChange(render);
}

var drawArea = new Rectangle(50, 50, 300, 300);
var layerSettings = [];
var layerIndex = 0;
var globalSettings = {
    baseColor: "#000000",
    addNewLayer: function()
    {
        var newSetting = new LayerSetting();
        layerSettings.push(newSetting);
        addLayerGui(gui, newSetting, 'layer' + layerIndex);
        layerIndex += 1;
    }
};

var gui = new dat.GUI();
gui.width = 600;
gui.addColor(globalSettings, 'baseColor').onFinishChange(render);
gui.add(globalSettings, 'addNewLayer').onFinishChange(render);