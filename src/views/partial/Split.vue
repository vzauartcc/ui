<template>
	<div v-if="!hiSectorData"><Spinner /></div>
	<div class="card" v-else>
		<div class="map-container">
			<h2 class="card-title">High Altitude Sectors</h2>
			<span>FL240 & Above</span>
			<LMap
				v-model:zoom="zoom"
				:center="center"
				:useGlobalLeaflet="false"
				:options="mapOptions"
				class="leaflet-map-hi"
				style="height: 500px"
				ref="highMap"
				@ready="mapReady"
			>
				<LGeoJson
					v-if="hiSectorData && hiSectorData.features.length"
					:geojson="hiSectorData"
					:options="testOptions"
				/>

				<div v-for="pos in labeledPositions" :key="pos.displayId">
					<LMarker :lat-lng="[pos.lat, pos.lng]" v-if="pos.mapLevel && pos.mapLevel === 'hi'">
						<LIcon :icon-anchor="[0, 0]" :iconSize="null" className="">
							<div :class="getLabelClass(pos)">
								{{ pos.name }} ({{ pos.id }})
								<!-- <br />
								{{ pos.frequency.slice(0, -1) }} -->
							</div>
						</LIcon>
					</LMarker>
				</div>

				<LMarker v-if="iowCorridorLabel" :lat-lng="staticCorridorCoords.iowCorridor">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="iowCorridorLabel.text"></div>
					</LIcon>
				</LMarker>

				<LMarker v-if="bvtCorridorLabel" :lat-lng="staticCorridorCoords.bvtCorridor">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="bvtCorridorLabel.text"></div>
					</LIcon>
				</LMarker>

				<LMarker v-if="showPmmKubbsSplit && pmmKubbsLabel" :lat-lng="staticCorridorCoords.pmmKubbs">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="pmmKubbsLabel.pmmText"></div>
					</LIcon>
				</LMarker>

				<LMarker v-if="bdfSplitLabel" :lat-lng="staticCorridorCoords.bdfSplit">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="bdfSplitLabel.text"></div>
					</LIcon>
				</LMarker>

				<LGeoJson v-if="zauHiBorders" :geojson="zauHiBorders" :options="testOptions" />

				<LGeoJson v-if="showPmmKubbsSplit" :geojson="pmmBorder" :options="testOptions" />
			</LMap>

			<h2 class="card-title">Low Altitude Sectors</h2>
			<span>FL230 & Below</span>
			<LMap
				v-model:zoom="zoom"
				:center="center"
				:useGlobalLeaflet="false"
				:options="mapOptions"
				class="leaflet-map-lo"
				style="height: 500px"
				ref="lowMap"
				@ready="mapReady"
			>
				<LGeoJson v-if="loSectorData" :geojson="loSectorData" :options="testOptions" />

				<div v-for="pos in labeledPositions" :key="pos.displayId">
					<LMarker :lat-lng="[pos.lat, pos.lng]" v-if="pos.mapLevel && pos.mapLevel === 'lo'">
						<LIcon :icon-anchor="[0, 0]" :iconSize="null" className="">
							<div :class="getLabelClass(pos)">
								{{ pos.name }} ({{ pos.id }})
								<!-- <br />
								{{ pos.frequency.slice(0, -1) }} -->
							</div>
						</LIcon>
					</LMarker>
				</div>

				<LMarker v-if="eonLowLabel" :lat-lng="staticCorridorCoords.eonLow">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="eonLowLabel.text"></div>
					</LIcon>
				</LMarker>

				<LMarker v-if="showPmmKubbsSplit && pmmKubbsLabel" :lat-lng="staticCorridorCoords.pmmKubbs">
					<LIcon :icon-anchor="[0, 0]" className="">
						<div class="spec-label" v-html="pmmKubbsLabel.kubbsText"></div>
					</LIcon>
				</LMarker>

				<LGeoJson v-if="zauLoBorders" :geojson="zauLoBorders" :options="testOptions" />

				<LGeoJson v-if="showPmmKubbsSplit" :geojson="pmmBorder" :options="testOptions" />
			</LMap>
		</div>
	</div>
</template>

<script>
// Import the necessary components and Leaflet objects
import { LGeoJson, LIcon, LMap, LMarker } from '@vue-leaflet/vue-leaflet';
import 'leaflet/dist/leaflet.css';
import { zauApi } from '../../helpers/axios';

// Fix for the Icon problem that prevents leaflet from working
import { Icon } from 'leaflet';
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
	iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default {
	name: 'MapComponent',
	components: {
		LMap,
		LGeoJson,
		LMarker,
		LIcon,
	},
	props: {
		positionsData: {
			type: Array,
			required: true,
		},
		ownershipData: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			hiSectorData: null,
			loSectorData: null,
			zauHiBorders: null,
			zauLoBorders: null,
			pmmBorder: null, // Assuming PMM border is separate or pulled from a list
			eonBorder: null, // Assuming EON border is separate or pulled from a list

			// Map Configuration
			zoom: 6.7,
			center: [42, -89],
			mapOptions: {
				zoomSnap: 0.1,
				zoomControl: false,
				doubleClickZoom: false,
				scrollWheelZoom: false,
				touchZoom: false,
				dragging: false,
			},
			isLoading: true,
			error: null,

			positions: new Map(),

			rawHiSectors: null,
			rawLoSectors: null,

			showPmmKubbsSplit: false,

			// Data objects for the special corridor labels
			iowCorridorLabel: null,
			bdfSplitLabel: null,
			bvtCorridorLabel: null,
			eonLowLabel: null,
			pmmKubbsLabel: null, // Used for both PMM and KUBBS text

			// Coordinates for static labels
			staticCorridorCoords: {
				iowCorridor: [42.182026, -90.919368],
				bdfSplit: [41.1, -90.4],
				bvtCorridor: [41.375229, -88.363288],
				eonLow: [41.120992, -88.302134],
				pmmKubbs: [42.77505, -86.045098],
			},
		};
	},
	watch: {
		hiSectorData: {
			handler() {
				if (!this.isLoading) {
					this.checkSpecialSectors();
				}
			},
			deep: true, // Watch for deep changes in the GeoJSON features
		},
		positionsData: {
			handler: 'initializePositionsAndProcessOwnership',
			immediate: true,
			deep: true,
		},
		ownershipData: {
			handler: 'processOwnershipUpdates',
			immediate: true,
			deep: true,
		},
	},
	async mounted() {
		// Start fetching data as soon as the component instance is created
		await this.fetchSectorsData();
	},
	computed: {
		// Generates the style and handler for each layer
		testOptions() {
			return {
				style: this.getSectorStyle,
				onEachFeature: this.onEachFeature,
			};
		},
		// Determines where labels are to be placed
		labeledPositions() {
			const labeled = [];

			const findFeature = (features, sectorId) => {
				if (!features) return null;
				return features.find(
					(f) => String(f.properties.id) === sectorId && f.properties.labelAnchor,
				);
			};

			const nonCorridors = (mySet) => {
				return new Set([...mySet].filter((y) => y !== '6' && y !== '9'));
			};

			for (const pos of this.positions.values()) {
				if (pos.ownedHi.size > 0) {
					const firstSectorId = nonCorridors(pos.ownedHi).values().next().value;
					const feature = findFeature(this.rawHiSectors.features, firstSectorId);

					if (feature && feature.properties.labelAnchor) {
						const latLng = feature.properties.labelAnchor;

						labeled.push({
							...pos,
							displayId: `${pos.id}-hi`,
							lat: latLng[0],
							lng: latLng[1],
							mapLevel: 'hi',
						});
					}
				}

				if (pos.ownedLo.size > 0) {
					const firstSectorId = pos.ownedLo.values().next().value;
					const feature = findFeature(this.rawLoSectors.features, firstSectorId);

					if (feature && feature.properties.labelAnchor) {
						const latLng = feature.properties.labelAnchor;

						labeled.push({
							...pos,
							displayId: `${pos.id}-lo`,
							lat: latLng[0],
							lng: latLng[1],
							mapLevel: 'lo',
						});
					}
				}
			}

			return labeled;
		},
	},
	methods: {
		mapReady(obj) {
			if (obj) {
				obj.createPane('bordersPane');
				obj.getPane('bordersPane').style.zIndex = 499;
			}
		},
		invalidateMaps() {
			this.$nextTick(() => {
				if (this.$refs.lowMap.leafletObject) {
					this.$refs.lowMap.leafletObject.invalidateSize(true);
				}
				if (this.$refs.highMap.leafletObject) {
					this.$refs.highMap.leafletObject.invalidateSize(true);
				}
			});
		},
		// Load data from API
		async fetchSectorsData() {
			this.isLoading = true;
			try {
				const { data } = await zauApi.get('/split/geojson');

				// Update the component state. This will trigger the LGeoJson components to render.
				this.hiSectorData = data.sectors.high;
				this.loSectorData = data.sectors.low;
				this.zauHiBorders = data.borders.high;
				this.zauLoBorders = data.borders.low;
				this.pmmBorder = data.borders.PMM;
				this.eonBorder = data.borders.EON;

				this.rawHiSectors = data.sectors.high;
				this.rawLoSectors = data.sectors.low;

				this.initializePositionsAndProcessOwnership();
			} catch (e) {
				console.error('Critical error during map data fetching:', e);
				this.toastError('Something went wrong, please try again later');
			} finally {
				this.isLoading = false;
			}
		},
		// Kickoff the rendering
		initializePositionsAndProcessOwnership() {
			if (this.positionsData && this.positionsData.length > 0) {
				this.initializePositionsMap();
				// Call the ownership processor immediately after initializing the map
				this.processOwnershipUpdates();
			}
		},
		initializePositionsMap() {
			// Build the internal map state from the prop data
			const map = new Map();
			this.positionsData.forEach((p) => {
				map.set(String(p.id), {
					...p,
					id: String(p.id),
					ownedHi: new Set(),
					ownedLo: new Set(),
				});
			});
			this.positions = map;
		},
		processOwnershipUpdates() {
			if (!this.positions.size || !this.rawHiSectors) {
				// Skip if positions or GeoJSON data aren't ready yet
				return;
			}

			this.applyOwnership(this.ownershipData);
		},
		// Determines the style for each GeoJSON sector feature.
		getSectorStyle(feature) {
			const fillColor = feature.properties.ownerColor || '#808080';

			return {
				color: '#3f3f3f', // Border color
				fillColor: fillColor,
				opacity: 1, // Border opacity
				weight: 1, // Border thickness
				fillOpacity: 1, // Fill opacity
			};
		},

		// Renders the border lines (ZAU, Neighbor, Interior).
		drawBorders(feature) {
			switch (feature.properties.borderType) {
				case 'ZAU':
					return {
						color: '#e4002b',
						weight: 5,
						pane: 'bordersPane',
					};
				case 'Neighbor':
					return {
						color: '#000000',
						weight: 2,
						pane: 'bordersPane',
					};
				case 'InteriorBoundary':
					return {
						color: '#3f3f3f',
						dashArray: 8,
						dashOffset: 8,
						opacity: 0.8,
						pane: 'bordersPane',
					};
				default:
					return {};
			}
		},
		// Applied to each layer of the LMap
		onEachFeature(feature, layer) {
			// Set the layer style here because the style option apparently doesn't work
			if (feature.properties.borderType) {
				layer.setStyle(this.drawBorders(feature));
			} else {
				layer.setStyle(this.getSectorStyle(feature));
			}
		},
		// Adds owned sectors to owner map
		applyOwnership(ownershipMap) {
			this.positions.forEach((p) => {
				p.ownedHi.clear();
				p.ownedLo.clear();
			});

			// Helper function to process ownership for a specific level (hi or lo)
			const processLevelOwnership = (level) => {
				// map is the ownership object for this level, e.g., { 0: 81, 1: 35, ... }
				const ownershipData = ownershipMap[level];
				if (!ownershipData) return;

				// Iterate over the sectors and their assigned owners for this level
				for (const sectorId in ownershipData) {
					const ownerId = String(ownershipData[sectorId]);
					const owner = this.positions.get(ownerId);

					if (owner) {
						// Assign to the correct Set based on the function argument 'level'
						if (level === 'high') {
							owner.ownedHi.add(String(sectorId));
						} else if (level === 'low') {
							owner.ownedLo.add(String(sectorId));
						}
					}
				}
			};

			processLevelOwnership('high');
			processLevelOwnership('low');

			this.updateSectorColors();
		},
		// Applies fillColor to polygon layers based on owner
		updateSectorColors() {
			// Function to clone GeoJSON, inject ownerColor, and return new data
			const processSectors = (rawSectors, level) => {
				if (!rawSectors) return { type: 'FeatureCollection', features: [] };

				const newSectors = JSON.parse(JSON.stringify(rawSectors));

				newSectors.features.forEach((feature) => {
					const sectorId = String(feature.properties.id);
					let ownerColor = '#808080'; // Default gray
					let isOwned = false;

					// Find owner by iterating through the map and checking the correct level's set
					for (const pos of this.positions.values()) {
						if (level === 'hi' && pos.ownedHi.has(sectorId)) {
							ownerColor = pos.color;
							isOwned = true;
							break;
						} else if (level === 'lo' && pos.ownedLo.has(sectorId)) {
							ownerColor = pos.color;
							isOwned = true;
							break;
						}
					}

					feature.properties.ownerColor = ownerColor;
					feature.properties.isOwned = isOwned;
				});

				// Color mixing for overlapping ownership
				if (level === 'hi') {
					newSectors.features.forEach((feature) => {
						if (feature.properties.name === 'IOW Corridor') {
							feature.properties.ownerColor = this.averageColors(
								newSectors.features.find((x) => x.properties.name === 'IOWA CITY').properties
									.ownerColor,
								newSectors.features.find((x) => x.properties.name === 'COTON').properties
									.ownerColor,
							);
						}

						if (feature.properties.name === 'BOILER CLIMB CORRIDOR') {
							feature.properties.ownerColor = this.averageColors(
								newSectors.features.find((x) => x.properties.name === 'BOILER').properties
									.ownerColor,
								newSectors.features.find((x) => x.properties.name === 'GIPPER').properties
									.ownerColor,
							);
						}

						if (feature.properties.name === 'BRADFORD') {
							feature.properties.ownerColor = this.averageColors(
								newSectors.features.find((x) => x.properties.name === 'BRADFORD').properties
									.ownerColor,
								newSectors.features.find((x) => x.properties.name === 'IOWA CITY').properties
									.ownerColor,
							);
						}
					});
				} else {
					newSectors.features.forEach((feature) => {
						if (feature.properties.name === 'LOW EON') {
							feature.properties.ownerColor = this.averageColors(
								newSectors.features.find((x) => x.properties.name === 'PEOTONE').properties
									.ownerColor,
								newSectors.features.find((x) => x.properties.name === 'PLANO').properties
									.ownerColor,
							);
						}
					});
				}
				return newSectors;
			};

			// Apply processing and force reactivity update with a spread operator
			this.hiSectorData = { ...processSectors(this.rawHiSectors, 'hi') };
			this.loSectorData = { ...processSectors(this.rawLoSectors, 'lo') };
		},
		// Apply a CSS class to the label based on if it special airspace or not
		getLabelClass(position) {
			let className = 'pos-label-base';

			if (position.isSpecial) {
				className += ' spec-label';
			} else {
				className += ' pos-label';
			}

			if (position.active) {
				className += ' pos-active';
			}

			return className;
		},
		// Get the average owner color for overlapping airspace
		averageColors(colorA, colorB) {
			const [rA, gA, bA] = colorA.match(/\w\w/g).map((c) => parseInt(c, 16));
			const [rB, gB, bB] = colorB.match(/\w\w/g).map((c) => parseInt(c, 16));
			const r = Math.round((rA + rB) * 0.5)
				.toString(16)
				.padStart(2, '0');
			const g = Math.round((gA + gB) * 0.5)
				.toString(16)
				.padStart(2, '0');
			const b = Math.round((bA + bB) * 0.5)
				.toString(16)
				.padStart(2, '0');
			return '#' + r + g + b;
		},
		// Gets the name of the owner of a sector and the default color of the owner
		getOwner(sectorFeature) {
			// Input is a GeoJSON feature from hiSectorData/loSectorData
			let id = String(sectorFeature.properties.id);
			let level = sectorFeature.properties.level;

			for (const pos of this.positions.values()) {
				if (level === 'hi' && pos.ownedHi.has(id)) {
					return pos;
				}
				if (level === 'lo' && pos.ownedLo.has(id)) {
					return pos;
				}
			}

			return { name: 'N/A', color: '#808080' };
		},
		// Displays corridor labels and handles showing interior boundaries
		checkSpecialSectors() {
			if (!this.hiSectorData || !this.loSectorData) return;

			// Helper to find a sector feature by name and level
			const findSector = (name, level) => {
				const data = level === 'hi' ? this.hiSectorData : this.loSectorData;
				return data.features.find((f) => f.properties.name === name);
			};

			// Helper to get the current fillColor (which we injected into properties)
			const getFillColor = (feature) => feature.properties.ownerColor;

			const layerCOTON = findSector('COTON', 'hi');
			const layerIOW = findSector('IOWA CITY', 'hi');
			const layerBDF = findSector('BRADFORD', 'hi');
			const layerBVT = findSector('BOILER', 'hi');
			const layerGIJ = findSector('GIPPER', 'hi');
			const layerPMM = findSector('PULLMAN', 'hi');

			const layerEON = findSector('PEOTONE', 'lo');
			const layerPLANO = findSector('PLANO', 'lo');
			const layerKUBBS = findSector('KUBBS', 'lo');

			if (
				!layerCOTON ||
				!layerIOW ||
				!layerBDF ||
				!layerBVT ||
				!layerGIJ ||
				!layerPMM ||
				!layerEON ||
				!layerPLANO ||
				!layerKUBBS
			)
				return;

			// ----------------------------------------------------
			// 1. IOW Corridor (Hi Map)
			// ----------------------------------------------------
			if (
				getFillColor(layerCOTON) === getFillColor(layerIOW) ||
				this.getOwner(layerCOTON).name === 'N/A' ||
				this.getOwner(layerIOW).name === 'N/A'
			) {
				this.iowCorridorLabel = null; // Hide label
			} else {
				this.iowCorridorLabel = {
					text: `${this.getOwner(layerIOW).name} FL240 - FL329 <br /> ${this.getOwner(layerCOTON).name} FL330+`,
					colorA: getFillColor(layerCOTON),
					colorB: getFillColor(layerIOW),
					fillColor: this.averageColors(getFillColor(layerCOTON), getFillColor(layerIOW)),
				};
			}

			// ----------------------------------------------------
			// 2. Bradford Split (Hi Map)
			// ----------------------------------------------------
			if (
				getFillColor(layerBDF) === getFillColor(layerIOW) ||
				this.getOwner(layerBDF).name === 'N/A' ||
				this.getOwner(layerIOW).name === 'N/A'
			) {
				this.bdfSplitLabel = null;
			} else {
				this.bdfSplitLabel = {
					text: `${this.getOwner(layerBDF).name} FL240 - FL330 <br /> ${this.getOwner(layerIOW).name} FL340+`,
					colorA: getFillColor(layerBDF),
					colorB: getFillColor(layerIOW),
					fillColor: this.averageColors(getFillColor(layerBDF), getFillColor(layerIOW)),
				};
			}

			// ----------------------------------------------------
			// 3. Boiler Climb Corridor (Hi Map)
			// ----------------------------------------------------
			if (
				getFillColor(layerBVT) === getFillColor(layerGIJ) ||
				this.getOwner(layerBVT).name === 'N/A' ||
				this.getOwner(layerGIJ).name === 'N/A'
			) {
				this.bvtCorridorLabel = null;
			} else {
				this.bvtCorridorLabel = {
					text: `${this.getOwner(layerBVT).name} <br /> FL240 - FL290`,
					colorA: getFillColor(layerBVT),
					colorB: getFillColor(layerGIJ),
					fillColor: this.averageColors(getFillColor(layerBVT), getFillColor(layerGIJ)),
				};
			}

			// ----------------------------------------------------
			// 4. Peotone (Low Map)
			// ----------------------------------------------------
			if (
				getFillColor(layerEON) === getFillColor(layerPLANO) ||
				this.getOwner(layerEON).name === 'N/A' ||
				this.getOwner(layerPLANO).name === 'N/A'
			) {
				this.eonLowLabel = null;
			} else {
				this.eonLowLabel = {
					text: `${this.getOwner(layerEON).name} 110 - FL230 <br /> ${this.getOwner(layerPLANO).name} SFC - 100`,
					colorA: getFillColor(layerEON),
					colorB: getFillColor(layerPLANO),
					fillColor: this.averageColors(getFillColor(layerEON), getFillColor(layerPLANO)),
				};
			}

			// ----------------------------------------------------
			// 5. PMM and KUBBS (Hi/Lo Map)
			// ----------------------------------------------------
			if (
				getFillColor(layerPMM) === getFillColor(layerKUBBS) ||
				this.getOwner(layerPMM).name === 'N/A' ||
				this.getOwner(layerKUBBS).name === 'N/A'
			) {
				this.showPmmKubbsSplit = false;
				this.pmmKubbsLabel = null;
			} else {
				this.showPmmKubbsSplit = true;
				this.pmmKubbsLabel = {
					pmmText: `${this.getOwner(layerPMM).name} FL200+`, // Hi Label
					kubbsText: `${this.getOwner(layerKUBBS).name} <br /> SFC - FL190`, // Lo Label
				};
			}
		},
	},
};
</script>

<style>
@import 'leaflet/dist/leaflet.css';

.map-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
}

/* Container for maps to be side-by-side */
.map-container > div:not(.leaflet-map-hi, .leaflet-map-lo) {
	display: flex;
	justify-content: space-around;
	width: 100%;
}

.leaflet-map-hi,
.leaflet-map-lo {
	/* Set a defined size for the map containers */
	height: 500px;
	border: 1px solid #ccc;
}

.spec-label {
	text-align: center;
	width: max-content;
	color: black;
	font-family: 'Roboto', Arial, Helvetica, sans-serif;
	font-weight: bold;
	font-size: 10px;
}

.pos-label-base {
	text-align: center;
	color: black;
	font-family: 'Roboto', Arial, sans-serif;
	font-weight: bold;
	font-size: 20px;
	line-height: 1;
	width: min-content;
}
</style>
