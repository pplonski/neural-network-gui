angular.module('app', ['flowchart', 'ngFileSaver'])
    .factory('prompt', function() {
        return prompt;
    })
    .config(function(NodeTemplatePathProvider) {
        NodeTemplatePathProvider.setTemplatePath("flowchart/node.html");
    })

    .controller('AppCtrl', function AppCtrl($scope, $window, prompt, Modelfactory, flowchartConstants, FileSaver) {

        console.log('< Start >');
        $scope.windowHeight = $window.innerHeight;
        $scope.windowWidth = $window.innerWidth;
        $scope.contentWidth = $window.innerWidth - 558;

        $scope.nodeDefaultX = 200; //$scope.contentWidth / 2 - 50;
        $scope.nodePaddingHeight = 110;

        angular.element($window).on("resize", function() {
            console.log("window resize");
            $scope.windowHeight = $window.innerHeight;
            $scope.contentWidth = $window.innerWidth - 558;
            $scope.$apply();
        });

        var deleteKeyCode = 46;
        var ctrlKeyCode = 17;
        var aKeyCode = 65;
        var escKeyCode = 27;
        var nextNodeID = 1;
        var nextConnectorID = 1;
        var ctrlDown = false;

        var lastTopConnectorId = 0;
        var lastBottomConnectorId = nextConnectorID;

        //var model = ;
        $scope.flowchartselected = [];
        //var modelservice

        $scope.model = { nodes: [], edges: []};
        $scope.modelservice = Modelfactory($scope.model, $scope.flowchartselected);

        var inputNode = {
                name: "Input",
                nodeType: "Input",

                id: nextNodeID++,
                x: $scope.nodeDefaultX,
                y: 15,
                color: '#000',
                borderColor: '#000',
                properties: {
                    'dimensions': [64, 64]
                },
                connectors: [{
                    type: flowchartConstants.bottomConnectorType,
                    id: nextConnectorID++
                }] };
        $scope.model.nodes.push(inputNode);
        $scope.nodeMap = {};
        $scope.nodeMap[inputNode['id']] = inputNode;
        $scope.input_dimensions = '2';
        $scope.input_dimension_1 = 48;
        $scope.input_dimension_2 = 48;
        inputNode['name'] = 'Input (' + $scope.input_dimension_1 + 'x' + $scope.input_dimension_2 + ')';

        // --- Dropout
        $scope.dropoutP = {};
        // --- Convolutional2D
        $scope.conv2DCount = {};
        $scope.conv2DKernel = {};
        $scope.conv2DPadding = {};
        $scope.conv2DStride = {};
        $scope.conv2DActivation = {};

        $scope.getNodeY = function() {
            return $scope.model.nodes.length * $scope.nodePaddingHeight + 25;
        };

        $scope.keyDown = function(evt) {
            if (evt.keyCode === ctrlKeyCode) {
                ctrlDown = true;
                evt.stopPropagation();
                evt.preventDefault();
            }
        };

        $scope.keyUp = function(evt) {

            if (evt.keyCode === deleteKeyCode) {
                $scope.modelservice.deleteSelected();
            }

            if (evt.keyCode == aKeyCode && ctrlDown) {
                $scope.modelservice.selectAll();
            }

            if (evt.keyCode == escKeyCode) {
                $scope.modelservice.deselectAll();
            }

            if (evt.keyCode === ctrlKeyCode) {
                ctrlDown = false;
                evt.stopPropagation();
                evt.preventDefault();
            }
        };

        $scope.addNewNode = function(nodeType) {
            if (!nodeType) {
                return;
            }

            lastTopConnectorId = nextConnectorID;

            var properties = {};
            if (nodeType == 'Dense') {
                properties = {
                    'units': 10,
                    'activation': 'ReLU'
                };
            } else if (nodeType == 'Convolutional2D') {
                properties = {
                    'kernel': '3x3',
                    'units': 96,
                    'stride': '1x1',
                    'padding': 'same',
                    'activation': 'ReLU'
                };
            } else if (nodeType == 'Dropout') {
                properties = {
                    'p': 0.5
                };
            } else if (nodeType == 'Flatten') {

            }

            console.log('Add node type: ' + nodeType);
            var newNode = {
                'name': nodeType + '  [id:' + nextNodeID + ']',
                'nodeType': nodeType,
                'id': nextNodeID++,
                'x': $scope.nodeDefaultX,
                'y': $scope.getNodeY(),
                'color': '#F15B26',
                'properties': properties,

                'connectors': [{
                        'id': nextConnectorID++,
                        'type': flowchartConstants.topConnectorType
                    },
                    {
                        'id': nextConnectorID++,
                        'type': flowchartConstants.bottomConnectorType
                    }
                ]
            };

            $scope.model.nodes.push(newNode);
            $scope.nodeMap[newNode.id] = newNode;

            if(newNode.nodeType == 'Dropout') {
                $scope.dropoutP[newNode.id] = properties.p;
                $scope.updateDropout(newNode.id);
            } else if(newNode.nodeType == 'Dense') {
                $scope.denseCount[newNode.id] = properties.units;
                $scope.denseActivation[newNode.id] = properties.activation;
                $scope.updateDense(newNode.id);
            } else if(newNode.nodeType == 'Convolutional2D') {
                $scope.conv2DCount[newNode.id] = properties.units;
                $scope.conv2DKernel[newNode.id] = properties.kernel;
                $scope.conv2DPadding[newNode.id] = properties.padding;
                $scope.conv2DStride[newNode.id] = properties.stride;
                $scope.conv2DActivation[newNode.id] = properties.activation;
                $scope.updateConv2D(newNode.id);
            }


            if (lastBottomConnectorId != 0) {
                $scope.model.edges.push({
                    'source': lastBottomConnectorId,
                    'destination': lastTopConnectorId,
                    'active': false
                });
            }
            lastBottomConnectorId = nextConnectorID - 1;
        };

        $scope.activateWorkflow = function() {
            angular.forEach($scope.model.edges, function(edge) {
                edge.active = !edge.active;
            });
        };

        $scope.addNewInputConnector = function() {
            var connectorName = prompt("Enter a connector name:", "New connector");
            if (!connectorName) {
                return;
            }

            var selectedNodes = $scope.modelservice.nodes.getSelectedNodes($scope.model);
            for (var i = 0; i < selectedNodes.length; ++i) {
                var node = selectedNodes[i];
                node.connectors.push({
                    id: nextConnectorID++,
                    type: flowchartConstants.topConnectorType
                });
            }
        };

        $scope.addNewOutputConnector = function() {
            var connectorName = prompt("Enter a connector name:", "New connector");
            if (!connectorName) {
                return;
            }

            var selectedNodes = $scope.modelservice.nodes.getSelectedNodes($scope.model);
            for (var i = 0; i < selectedNodes.length; ++i) {
                var node = selectedNodes[i];
                node.connectors.push({
                    id: nextConnectorID++,
                    type: flowchartConstants.bottomConnectorType
                });
            }
        };

        $scope.updateInput = function() {
            if($scope.input_dimensions == '1') {
              inputNode['name'] = 'Input (' + $scope.input_dimension_1 + ')';
            } else if($scope.input_dimensions == '2') {
              inputNode['name'] = 'Input (' + $scope.input_dimension_1 + 'x' + $scope.input_dimension_2 + ')';
            }
        };

        $scope.updateDense = function(nodeId) {
            if($scope.nodeMap.hasOwnProperty(nodeId)) {
              var tmpNode = $scope.nodeMap[nodeId];
              tmpNode.name = tmpNode.nodeType + ' units:' + $scope.denseCount[nodeId] + ' [' + $scope.denseActivation[nodeId] + ']';
              tmpNode.properties.units = $scope.denseCount[nodeId];
              tmpNode.properties.activation = $scope.denseActivation[nodeId];
            }
        };

        $scope.updateDropout = function(nodeId) {
            if($scope.nodeMap.hasOwnProperty(nodeId)) {
              var tmpNode = $scope.nodeMap[nodeId];
              tmpNode.name = tmpNode.nodeType + ' (p:' + $scope.dropoutP[nodeId] + ')';
              tmpNode.properties.p = $scope.dropoutP[nodeId];
            }
        };

        $scope.updateConv2D = function(nodeId) {
            if($scope.nodeMap.hasOwnProperty(nodeId)) {
                var tmpNode = $scope.nodeMap[nodeId];
                tmpNode.name = tmpNode.nodeType + ' ' + $scope.conv2DKernel[nodeId] + 'x' + $scope.conv2DCount[nodeId] + ' [' + $scope.conv2DActivation[nodeId] + ']';
                tmpNode.properties.units = conv2DCount[nodeId];
                tmpNode.properties.kernel = conv2DKernel[nodeId];
                tmpNode.properties.padding = conv2DPadding[nodeId];
                tmpNode.properties.stride = conv2DStride[nodeId];
                tmpNode.properties.activation = conv2DActivation[nodeId];
            }
        };

        $scope.exportNetwork = function() {
            console.log('Export network');
            console.log('--- Node listing ---');
            angular.forEach($scope.model.nodes, function(node) {
                console.log('Node: ' + node.id + ' ' + node.name + ' ' + node.properties);
            });
            console.log('--- End listing ---');

            var filename = 'architecture.csv';
            var data = new Blob(['{"data":"test"}'], { type: 'text/csv;charset=ascii' });
            FileSaver.saveAs(data, filename);
        };

        $scope.deleteSelected = function() {
            $scope.modelservice.deleteSelected();
        };

        $scope.callbacks = {
            edgeDoubleClick: function() {
                //console.log('Edge double clicked.');
            },
            edgeMouseOver: function() {
                //console.log('mouserover');
            },
            isValidEdge: function(source, destination) {
                return source.type === flowchartConstants.bottomConnectorType && destination.type === flowchartConstants.topConnectorType;
            },
            edgeAdded: function(edge) {
                //console.log("edge added");
                //console.log(edge);
            },
            nodeRemoved: function(node) {
                //console.log("node removed");
                //console.log(node);
                lastBottomConnectorId = 0;
            },
            edgeRemoved: function(edge) {
                //console.log("edge removed");
                //console.log(edge);
            },
            nodeCallbacks: {
                'doubleClick': function(event) {
                    //console.log('Node was doubleclicked.');
                }
            }
        };
        $scope.modelservice.registerCallbacks($scope.callbacks.edgeAdded, $scope.callbacks.nodeRemoved, $scope.callbacks.edgeRemoved);

    });
