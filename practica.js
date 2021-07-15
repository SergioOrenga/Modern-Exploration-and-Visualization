d3.json('practica_airbnb.json').then((featureCollection) => {
  drawMap(featureCollection)
})

var indice = 0 //Creamos el índice que usaremos para seleccionar los datos de la gráfica.Cuando se carga la página se muestra la gráfica del barrio que está en la primera posición del json.

//Creamos el elemento Tooltip
var tooltip = d3
  .select('#mapa')
  .append('div')
  .attr('class', 'tooltip')
  .style('position', 'absolute') //Para obtener la posicion correcta sobre los barrios
  .style('pointer-events', 'none') //Para evitar el flicker
  .style('visibility', 'hidden')
  .style('background-color', 'white')
  .style('border', 'solid')
  .style('border-width', '1px')
  .style('border-radius', '5px')
  .style('padding', 5)

function drawMap(featureCollection) {
  console.log(featureCollection)
  console.log(featureCollection.features)
  var width = 800
  var height = 800

  featureCollection.features.forEach((d, i) => {
    d.index = i //Añadimos el índice como propiedad de cada objeto
  })

  var svg = d3
    .select('#mapa')
    .append('svg')
    .attr('width', width)
    .attr('height', height + 110)
    .attr('y', 0)
    .append('g')

  var center = d3.geoCentroid(featureCollection) //Encontrar la coordenada central del mapa (de la featureCollection)

  //to translate geo coordinates[long,lat] into X,Y coordinates.
  var projection = d3
    .geoMercator()
    .fitSize([width, height], featureCollection)
    .center(center) //centrar el mapa en una long,lat determinada
    .translate([width / 2, height / 1.5]) //centrar el mapa en una posicion x,y determinada

  //Para crear paths a partir de una proyección
  var pathProjection = d3.geoPath().projection(projection)
  var features = featureCollection.features

  var createdPath = svg
    .selectAll('path')
    .data(features)
    .enter()
    .append('path')
    .attr('d', (d) => pathProjection(d))
    .attr('stroke', function (d) {
      d.stroke = 'none'
    })

  createdPath.on('click', function (event, d) {
    d.stroke = d.stroke == 'none' ? 'black' : 'none' //Marca con una linea negra de puntos el contorno del barrio sobre el que se hace clic. Cuando se vuelve a hacer cick sobre el barrio, la linea de puntos desaparece.

    d3.select(this)
      .transition()
      .duration(100)
      .delay(100)
      .attr('stroke', d.stroke)
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', 5)
    indice = d.index //Asignamos el índice del barrio seleccionado para actualizar la gráfica con los datos de dicho barrio
    d3.select('#grafica').select('svg').remove() //Eliminamos la gráfica anterior
    dibujarGrafica(indice) //Dibujamos la gráfica con el barrio seleccionado con el evento click del ratón
  })

  createdPath.on('mouseover', handleMouseOver).on('mouseout', handleMouseOut)

  var maximo = d3.max(features, function (d) {
    return d.properties.avgprice
  })
  var minimo = d3.min(features, function (d) {
    return d.properties.avgprice
  })

  var color = d3.schemeTableau10
  var scaleColor = d3.scaleOrdinal(d3.schemeTableau10)
  createdPath.attr('fill', function (d) {
    //Se divide el rango de precios en tantas partes como colores tiene la paleta seleccionada y se le asigna a cada barrio un color dependiendo de su precio medio
    var tamanyo = (maximo + 1 - minimo) / color.length
    for (var i = 0; i < color.length; i++) {
      if (d.properties.avgprice == null) {
        return 'grey' //los barrios que no tienen valor en avgprice se pintan de color gris
      } else if (
        d.properties.avgprice >= parseInt(minimo + tamanyo * i) &&
        d.properties.avgprice < parseInt(minimo + tamanyo * (i + 1))
      ) {
        return color[i]
      }
    }
  })

  //Creacion de una leyenda
  var nblegend = color.length
  var widthRect = width / nblegend - 2
  var heightRect = 10

  //creación del título
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '20px')
    .style('text-decoration', 'underline')
    .text('Mapa del precio medio del alquiler en los barrios de Madrid')

  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 50)
    .attr('text-anchor', 'middle')
    .style('font-size', '15px')
    .style('font-style', 'italic')
    .text(
      'Leyenda: codigos de colores por precio medio de alquiler por barrio. Los que no tienen precio establecido se muestran en color gris',
    )

  var scaleLegend = d3.scaleLinear().domain([0, nblegend]).range([0, width])

  var legend = svg
    .append('g')
    .selectAll('rect')
    .data(color)
    .enter()
    .append('rect')
    .attr('width', widthRect)
    .attr('height', heightRect)
    .attr('x', (d, i) => scaleLegend(i))
    .attr('y', 60)
    .attr('fill', (d) => d)

  var tamanyo = (maximo + 1 - minimo) / color.length
  var text_legend = svg
    .append('g')
    .selectAll('text')
    .data(color)
    .enter()
    .append('text')
    .attr('x', (d, i) => scaleLegend(i))
    .attr('y', heightRect * 8)
    .text(function (d, i) {
      return parseInt(minimo + tamanyo * i) + ' Eur'
    })
    .attr('font-size', 12)
}

function handleMouseOver(event, d) {
  d3.select(this).transition().duration(1000)

  tooltip
    .transition()
    .duration(200)
    .style('visibility', 'visible')
    .style('left', event.pageX + 20 + 'px')
    .style('top', event.pageY - 30 + 'px')
    .text(
      `Barrio: ${d.properties.name}, Precio medio: ${d.properties.avgprice} Eur`,
    )
}

function handleMouseOut(event, d) {
  d3.select(this).transition().duration(200)

  tooltip.transition().duration(200).style('visibility', 'hidden')
}

//Aquí empieza el código de la gráfica

dibujarGrafica(indice)

function dibujarGrafica(idx) {
  d3.json('practica_airbnb.json').then((featureCollectionTwo) => {
    drawGraph(featureCollectionTwo)
  })

  function drawGraph(featureCollectionTwo) {
    console.log(featureCollectionTwo)
    console.log(featureCollectionTwo.features)

    var height = 500
    var width = 700
    var marginbottom = 100
    var margintop = 80

    var svg = d3
      .select('#grafica')
      .append('svg')
      .attr('width', width + 50)
      .attr('height', height + marginbottom + margintop)
      .append('g')
      .attr('transform', 'translate(50,' + margintop + ')')

    var featuresGraph =
      featureCollectionTwo.features[idx].properties.avgbedrooms

    //Creacion de escalas
    var domainX = featuresGraph.map(function (d) {
      return d.bedrooms
    })

    var xscale = d3.scaleBand().domain(domainX).range([0, width]).padding(0.1)

    var yscale = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(featuresGraph, function (d) {
          return d.total
        }),
      ])
      .range([height, 0])

    //Creación de eje X
    var xaxis = d3.axisBottom(xscale)
    var yaxis = d3.axisLeft(yscale)

    //Creacion de los rectangulos
    var rect = svg
      .selectAll('rect')
      .data(featuresGraph)
      .enter()
      .append('rect')
      .attr('fill', '#f28383')

    rect.attr('class', (d) => {
      if (d.total > 10) {
        return 'rectwarning'
      }
    })

    rect
      .attr('x', function (d) {
        return xscale(d.bedrooms)
      })
      .attr('y', (d) => {
        return yscale(0)
      })
      .attr('width', xscale.bandwidth())
      .attr('height', function () {
        return height - yscale(0) //Al cargarse los rectangulos tendran una altura de 0
      })
      .on('mouseover', function () {
        d3.select(this).attr('class', '').attr('fill', '#e3dd24')
      })
      .on('mouseout', function () {
        d3.select(this)
          .attr('fill', '#f28383')
          .attr('class', (d) => {
            if (d.total > 10) {
              return 'rectwarning'
            }
          })
      })

    rect
      .transition() //transición de entrada
      .duration(1000)
      .delay(function (d, i) {
        return i * 300
      })
      .attr('y', (d) => {
        return yscale(d.total)
      })
      .attr('height', function (d) {
        return height - yscale(d.total) //Altura real de cada rectangulo.
      })

    //Añadimos el texto correspondiente a cada rectangulo.
    var text = svg
      .selectAll('text')
      .data(featuresGraph)
      .enter()
      .append('text')
      .text((d) => d.total)
      .attr('x', function (d) {
        return xscale(d.bedrooms) + xscale.bandwidth() / 2
      })
      .attr('y', (d) => {
        return yscale(d.total)
      })
      .style('opacity', 0)

    //Transicción de entrada en el texto.
    text.transition().duration(500).style('opacity', 1)

    //Añadimos el eje X
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xaxis)

    //Añadimos eje Y
    svg.append('g').attr('transform', 'translate(0, 0)').call(yaxis)

    // Titulo x axis
    svg
      .append('text')
      .attr(
        'transform',
        'translate(' + width / 2 + ' ,' + (height / 2 + 285) + ')',
      )
      .style('text-anchor', 'middle')
      .text('Numero de habitaciones')

    // Titulo y axis
    svg
      .append('text')
      .attr('y', -50)
      .attr('x', -250)
      .attr('transform', 'rotate(-90)')
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Numero de propiedades')

    //creación del título
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .style('text-decoration', 'underline')
      .text(
        'Grafica del numero de propiedades del barrio ' +
          featureCollectionTwo.features[idx].properties.name,
      )

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '15px')
      .style('font-style', 'italic')
      .text(
        'Agrupadas por numero de habitaciones disponibles en cada propiedad',
      )
  }
}
