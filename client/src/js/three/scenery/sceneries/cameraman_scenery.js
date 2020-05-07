import Scenery from "../Scenery";
import Camera from "../../camera/Camera";
import Model from "../../model/Model";
import Light from "../../light/Light";
import Sound from "../../sound/Sound";
import cameraTypes from "../../camera/cameraTypes";
import controlsTypes from "../../controls/controlsTypes";
import * as THREE from "three";
import {lineToCurve} from "../../../helpers/Utils";
import {MathUtils} from "three";
import EventManager from "../../../event/EventManager";
import {Vector3} from "three";
import gsap from 'gsap'
import store from "../../../../store";
import appStates from "../../../appStates";
import THREEx from "../../light/VolumetricLightMaterial";

export default new Scenery({
    name: 'cameraman_scenery',
    cameras: [
        new Camera({
            type: cameraTypes.CINEMATIC,
            properties: {fov: 1, aspectRatio: window.innerWidth / window.innerHeight, near: 1, far: 1500},
            initialPosition: {x: -50, y: 150, z: -300},
            settings: {
                focalLength: 33,
                focusDistance: 100,
            },
        }),
        new Camera({
            type: cameraTypes.CINEMATIC,
            properties: {fov: 1, aspectRatio: window.innerWidth / window.innerHeight, near: 1, far: 1500},
            initialPosition: {x: 0, y: 0, z: 0},
            settings: {
                alphaOffset: MathUtils.degToRad(180),
                focalLength: 40,
                focusDistance: 120,
            },
        }),
        new Camera({
            type: cameraTypes.CINEMATIC,
            properties: {fov: 1, aspectRatio: window.innerWidth / window.innerHeight, near: 1, far: 1500},
            initialPosition: {x: 0, y: 0, z: 0},
            settings: {
                focalLength: 40,
                focusDistance: 300
            },
        }),
        new Camera({
            type: cameraTypes.CINEMATIC,
            properties: {fov: 1, aspectRatio: window.innerWidth / window.innerHeight, near: 1, far: 1500},
            initialPosition: {x: 30, y: 30, z: 30},
            settings: {
                alphaOffset: MathUtils.degToRad(180),
                showFocus: true,
                focalLength: 60,
                focusDistance: 20
            },
        }),
        new Camera({
            type: cameraTypes.PERSPECTIVE,
            properties: {fov: 30, aspectRatio: window.innerWidth / window.innerHeight, near: 1, far: 1500},
            initialPosition: {x: 0, y: 300, z: 0},
        })
    ],
    // controls: controlsTypes.ORBIT,
    models: [
        new Model({
            name: 'cameraman_scenery',
            path: 'models/glb/cameraman_scenery.glb',
            type: 'glb'
        }),
        new Model({
            name: 'actress_scenery',
            path: 'models/glb/actress_scenery.glb',
            type: 'glb'
        }),
        new Model({
            name: 'cones_cameraman_scenery',
            path: 'models/glb/cones_cameraman_scenery.glb',
            type: 'glb'
        }),
        new Model({
            name: 'camera_splines',
            path: 'models/fbx/cameraman/camera_splines.fbx',
            type: 'fbx'
        }),
    ],
    lights: [
        new Light({
            name: 'ambiant',
            light: new THREE.HemisphereLight(0xffb8c6, 0x080820),
            initialPosition: {x: 0, y: 300, z: 0},
            debug: true
        }),
        new Light({
            name: 'spotlights',
            light: new THREE.DirectionalLight(0xff4444, 1),
            initialPosition: {x: 0, y: 200, z: -700},
            properties: {
                castShadow: true
            },
            debug: true
        }),
    ],
    sounds: [
        new Sound({
            name: 'tuto_intro',
            path: 'sound/cameraman/tuto_intro.mp3',
            isLoop: false,
            volume: 1,
        }),
    ],
    onCreated: (self) => {

        // --------------------- //
        // ATTRIBUTES DEFINITIONS
        // --------------------- //

        // Camera animation
        self.camPosIndex = 0;
        self.cameraCurves = [];
        self.cameraProgres = 0;

        self.currentSequence = 1

        // TODO : A l'aide

        self.sequences = [
            // Intro
            {
                name: 'run sound intro',
                cameraIndex: 0,
                init: (self) => {

                    const cameraPosition = self.cameraCurves.find(curve => curve.name === 'P0_TRAVEL').getPointAt(0)
                    self.cameraManager.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)

                    // FIXME: load sounds globally
                    setTimeout(() => {
                        self.soundManager.getSoundByName('tuto_intro').source.onended = () => {
                            EventManager.publish('camera:start')
                        }
                    }, 0)
                    self.soundManager.getSoundByName('tuto_intro').play()

                    let startEvent = EventManager.subscribe('camera:started', () => {
                        self.nextSequence(self)

                        startEvent.unsubscribe()
                    })

                    // self.nextSequence(self) // TODO : Remove
                },
                update: null
            },
            {
                name: 'traveling intro',
                cameraIndex: 0,
                init: (self) => {
                    const tl = new gsap.timeline()
                    tl.pause(0);
                    tl.to(self.cameraManager.camera.rotation, {
                        duration: 17,
                        y: MathUtils.degToRad(MathUtils.radToDeg(self.cameraManager.camera.rotation.y) - 100),
                    })


                    tl.play();
                    EventManager.publish('camera:rec', true)
                },
                update: (self) => {
                    self.followCurve(self, {
                            curveName: "P0_TRAVEL",
                            cameraIndex: 0,
                            duration: 10, // 1000
                        },
                        (self) => {
                            EventManager.publish('camera:rec', false)
                            self.nextSequence(self)
                        })
                }
            },
            {
                name: 'transition to traveling',
                cameraIndex: 0,
                init: (self) => {
                    EventManager.publish('transition:start', {
                        text: ''
                    })

                    let transitionEvent = EventManager.subscribe('transition:ended', () => {
                        self.nextSequence(self)

                        transitionEvent.unsubscribe()
                    })

                }
            },

            // Traveling
            {
                name: 'tuto cadrage',
                cameraIndex: 1,
                init: (self) => {
                    self.cameraManager.setControls(controlsTypes.MOBILE)
                    const cameraPosition = self.cameraCurves.find(curve => curve.name === 'P1_TRAVEL').getPointAt(0)
                    self.cameraManager.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)

                    EventManager.publish('mobile:interaction_set', 'framing')

                    // Start tutorial
                    EventManager.publish('tutorial:display', {
                        title: 'Cadre l\'image',
                        subtitle: 'Oriente la caméra en pivotant le téléphone',
                        icon: 'tutorial_icon_framing.svg',
                        animation: 'orientation',
                    })


                    // On tutorial finished
                    const displayedEvent = EventManager.subscribe('tutorial:displayed', () => {
                        self.sequences[self.currentSequence].ready = true
                        self.nextSequence(self)
                        // Unsubscribe the event
                        displayedEvent.unsubscribe();
                    })
                }
            },
            {
                name: 'cadrage traveling',
                cameraIndex: 1,
                ready: false,
                init: () => {
                    EventManager.publish('camera:instructions', 'Cadre l\'image')
                    self.sequences[self.currentSequence].ready = true
                },
                update: (self) => {
                    const sequence = self.sequences[self.currentSequence]

                    // When ready
                    if(!sequence.ready) return

                    self.frameTarget(self, {
                        target: new Vector3(0.1,-0.54, 0.83),
                        threshold: .1,
                        camera: self.cameraManager.camera,
                        onComplete: (self) => {
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        }
                    })

                }
            },
            {
                name: 'tuto traveling',
                cameraIndex: 1,
                init: (self) => {
                    self.cameraManager.controls = null

                    EventManager.publish('mobile:interaction_set', 'traveling')

                    // Start tutorial
                    EventManager.publish('tutorial:display', {
                        title: 'Effectue un traveling',
                        subtitle: 'Utilise le curseur pour lancer le travelling',
                        icon: 'tutorial_icon_traveling.svg',
                    })


                    // On tutorial finished
                    const displayedEvent = EventManager.subscribe('tutorial:displayed', () => {
                        self.sequences[self.currentSequence].ready = true
                        self.nextSequence(self)
                        // Unsubscribe the event
                        displayedEvent.unsubscribe();
                    })
                }
            },
            {
                name: 'traveling',
                cameraIndex: 1,
                ready: false,
                init: () => {
                    EventManager.publish('mobile:interaction_enable')
                    EventManager.publish('camera:rec', true)
                    EventManager.publish('camera:instructions', 'Effectue un traveling')
                    const curve = self.cameraCurves.find(curve => curve.name === 'P1_TRAVEL')
                    const finalPosition = curve.getPointAt(1)

                    const interactionEvent = EventManager.subscribe('mobile:interaction', (data) => {
                        // Check if traveling
                        if(data.type !== 'traveling') return
                        data.value *= 0.2
                        const position = curve.getPointAt(data.value)
                        self.cameraManager.camera.position.set(position.x, position.y, position.z)

                    })

                    // On interaciton done
                    const travelingEvent = EventManager.subscribe('mobile:interaction_done', () => {
                        self.sequences[self.currentSequence].ready = true
                        gsap.to(self.cameraManager.camera.position, {
                            duration: 5,
                            ease: 'power1.out',
                            x: finalPosition.x,
                            y: finalPosition.y,
                            z: finalPosition.z,
                        }).then(() => {
                            EventManager.publish('camera:rec', false)
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        })

                        // Unsubscribe the events
                        interactionEvent.unsubscribe()
                        travelingEvent.unsubscribe();
                    })
                },
            },
            {
                name: 'transition to zoom',
                cameraIndex: 1,
                init: (self) => {
                    EventManager.publish('transition:start', {
                        text: 'Il faut savoir mettre en avant les atouts de nos actrices. Le réalisateur a fait un très bon choix de commencer par un traveling de bas en haut.'
                    })

                    self.nextSequence(self)
                }
            },

            // Zoom
            {
                name: 'cadrage zoom',
                cameraIndex: 2,
                ready: false,
                init: () => {
                    EventManager.publish('camera:progress', 0)
                    self.cameraManager.setControls(controlsTypes.MOBILE)
                    const cameraPosition = self.cameraCurves.find(curve => curve.name === 'P2_ZOOM').getPointAt(0)
                    self.cameraManager.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
                    EventManager.publish('camera:aiming', {distance: 4, threshold: 1, aiming: false})
                    EventManager.publish('mobile:interaction_set', 'framing')

                    let transitionEvent = EventManager.subscribe('transition:ended', () => {
                        EventManager.publish('camera:instructions', 'Cadre l\'image')
                        self.sequences[self.currentSequence].ready = true

                        transitionEvent.unsubscribe()
                    })
                },
                update: (self) => {
                    const sequence = self.sequences[self.currentSequence]

                    // When ready
                    if(!sequence.ready) return

                    self.frameTarget(self, {
                        target: new Vector3(0.3,0.25, -0.9),
                        threshold: .1,
                        camera: self.cameraManager.camera,
                        onComplete: (self) => {
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        }
                    })

                }
            },
            {
                name: 'tuto zoom',
                cameraIndex: 2,
                init: (self) => {
                    self.cameraManager.controls = null

                    EventManager.publish('mobile:interaction_set', 'zoom')

                    // Start tutorial
                    EventManager.publish('tutorial:display', {
                        title: 'Effectue un zoom',
                        subtitle: 'UTILISE LE CURSEUR POUR lancer le zoom ',
                        icon: 'tutorial_icon_zoom.svg',
                    })

                    // On tutorial finished
                    const displayedEvent = EventManager.subscribe('tutorial:displayed', () => {
                        self.sequences[self.currentSequence].ready = true
                        self.nextSequence(self)
                        // Unsubscribe the event
                        displayedEvent.unsubscribe();
                    })
                }
            },
            {
                name: 'zoom',
                cameraIndex: 2,
                ready: false,
                init: (self) => {
                    self.cameraManager.controls = null
                    EventManager.publish('camera:instructions', 'Effectue un zoom')
                    const curve = self.cameraCurves.find(curve => curve.name === 'P2_ZOOM')
                    const finalPosition = curve.getPointAt(1)

                    EventManager.publish('mobile:interaction_enable')
                    EventManager.publish('camera:rec', true)

                    // On interaction
                    const interactionEvent = EventManager.subscribe('mobile:interaction', (data) => {
                        // Check if traveling
                        if(data.type !== 'zoom') return
                        data.value *= 0.2
                        const position = curve.getPointAt(data.value)
                        self.cameraManager.camera.position.set(position.x, position.y, position.z)
                    })

                    // On interaction done
                    const travelingEvent = EventManager.subscribe('mobile:interaction_done', () => {
                        self.sequences[self.currentSequence].ready = true

                        gsap.to(self.cameraManager.camera.position, {
                            duration: 6,
                            ease: 'power1.out',
                            x: finalPosition.x,
                            y: finalPosition.y,
                            z: finalPosition.z,
                        }).then(() => {
                            EventManager.publish('camera:rec', false)
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        })

                        // Unsubscribe the event
                        travelingEvent.unsubscribe();
                        interactionEvent.unsubscribe();
                    })
                },
            },
            {
                name: 'transition to rotation',
                cameraIndex: 2,
                init: (self) => {
                    EventManager.publish('transition:start', {
                        text: 'Un zoom en contre plongée assure un côté dominateur à tout les coups !'
                    })

                    self.nextSequence(self)
                }
            },

            // Rotation
            {
                name: 'cadrage rotation',
                cameraIndex: 3,
                ready: false,
                init: () => {
                    EventManager.publish('camera:progress', 0)
                    self.cameraManager.setControls(controlsTypes.MOBILE)
                    const cameraPosition = self.cameraCurves.find(curve => curve.name === 'P3_ROTATION').getPointAt(0)
                    self.cameraManager.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
                    EventManager.publish('camera:aiming', {distance: 4, threshold: 1, aiming: false})
                    EventManager.publish('mobile:interaction_set', 'framing')

                    let transitionEvent = EventManager.subscribe('transition:ended', () => {
                        self.sequences[self.currentSequence].ready = true
                        EventManager.publish('camera:instructions', 'Cadre l\'image')
                        transitionEvent.unsubscribe()
                    })
                },
                update: (self) => {
                    const sequence = self.sequences[self.currentSequence]

                    // When ready
                    if(!sequence.ready) return

                    self.frameTarget(self, {
                        target: new Vector3(-0.16,-0.33, 0.9),
                        threshold: .1,
                        camera: self.cameraManager.camera,
                        onComplete: (self) => {
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        }
                    })

                }
            },
            {
                name: 'tuto rotation',
                cameraIndex: 3,
                init: (self) => {
                    self.cameraManager.controls = null

                    EventManager.publish('mobile:interaction_set', 'rotation')

                    // Start tutorial
                    EventManager.publish('tutorial:display', {
                        title: 'EFFECTUE UNE ROTATION',
                        subtitle: 'PIVOTE LE Téléphone vers la droite pour effectuer une rotation',
                        icon: 'tutorial_icon_rotation.svg',
                    })

                    // On tutorial finished
                    const displayedEvent = EventManager.subscribe('tutorial:displayed', () => {
                        self.sequences[self.currentSequence].ready = true
                        self.nextSequence(self)
                        // Unsubscribe the event
                        displayedEvent.unsubscribe();
                    })
                }
            },
            {
                name: 'rotation',
                cameraIndex: 3,
                ready: false,
                init: (self) => {
                    EventManager.publish('mobile:interaction_enable')
                    EventManager.publish('camera:rec', true)
                    EventManager.publish('camera:instructions', 'Effectue une rotation')

                    const y = self.cameraManager.camera.rotation.y
                    const finalRotation = y + MathUtils.degToRad(20)

                    // On interaction
                    const interactionEvent = EventManager.subscribe('mobile:interaction', (data) => {
                        // Check if traveling
                        if(data.type !== 'rotation') return
                        data.value *= 0.2
                        self.cameraManager.camera.rotation.y = y + (data.value * (finalRotation - y))
                    })

                    // On interaction done
                    const travelingEvent = EventManager.subscribe('mobile:interaction_done', () => {

                        self.sequences[self.currentSequence].ready = true

                        gsap.to(self.cameraManager.camera.rotation, {y: finalRotation, duration: 6}).then(() => {
                            EventManager.publish('camera:rec', false)
                            EventManager.publish('camera:instructions', null)
                            self.nextSequence(self)
                        })

                        // Unsubscribe events
                        travelingEvent.unsubscribe();
                        interactionEvent.unsubscribe();
                    })
                },
            },
            {
                name: 'transition to actress scenery',
                cameraIndex: 3,
                init: (self) => { // eslint-disable-line
                    EventManager.publish('transition:start', {
                        text: 'Filmer la femme de bas en haut permet de la rendre sexy et encourage l’audience à prendre plus de plaisir en la regardant'
                    })

                    let transitionEvent = EventManager.subscribe('transition:ended', () => {
                        store.dispatch('app/requestState', appStates.ACTRESS)

                        transitionEvent.unsubscribe()
                    })
                }
            },
        ]

        // -- METHODS

        /** Go to next sequence */
        self.nextSequence = (self) => {
            if (self.currentSequence >= self.sequences.length) return // No next sequence
            self.currentSequence += 1
            self.cameraManager.changeCamera(self.sequences[self.currentSequence].cameraIndex)
            if(typeof self.sequences[self.currentSequence].init === 'function') self.sequences[self.currentSequence].init(self)
        }


        /** Display curve */
        self.displayCurve = (self, {curve}) => {
            const points = curve.getSpacedPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const material = new THREE.LineBasicMaterial({color: 0x00ff00});

            // Create the final object to add to the scene
            let splineObject = new THREE.Line(geometry, material);

            self.scene.add(splineObject)
        }

        /**
         * Build volumetric lights
         * @param self
         * @param mesh
         * @param color
         */
        self.buildVolumetricLight = (self, {mesh, color}) => {
            const lightColor = color ?? 0xff0000;

            mesh.translateY(-100)
            mesh.material = new THREEx.VolumetricSpotLightMaterial(2.8, 5., mesh.position, new THREE.Color(lightColor), 1.);
            mesh.geometry = new THREE.CylinderGeometry(18., 200., 300, 32 * 2, 20, true);
            mesh.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 50, 0));

            const spotLight = new THREE.SpotLight(lightColor);
            spotLight.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
            spotLight.color = new THREE.Color(lightColor);
            spotLight.exponent = 30;
            spotLight.angle = 0.9;
            spotLight.intensity = 1;
            spotLight.decay = 0.5;
            spotLight.penumbra = 0.5;
            spotLight.castShadow = true;
            spotLight.target.position.set(mesh.position.x, 0, mesh.position.z);
            self.scene.add(spotLight);
            self.scene.add(spotLight.target);
        }

    },
    onLoaded: (self) => {
        console.log('self', self)

        // self.cameraManager.changeCamera(4)
        // self.cameraManager.controls.object = self.cameraManager.cameraObjects[4].camera

        // ---------------- //
        // Lights
        // ---------------- //

        // Build volumetric lights
        self.buildVolumetricLight(self, {mesh: self.scene.getObjectByName('LAMPE_ACTRICE'), color: 0xFFE5A3})
        self.buildVolumetricLight(self, {mesh: self.scene.getObjectByName('PROJECTEUR_01'), color: 0xDE2900})
        self.buildVolumetricLight(self, {mesh: self.scene.getObjectByName('PROJECTEUR_02'), color: 0xDE2900})

        // ---------------- //
        // Camera curves
        // ---------------- //

        if (self.scene.getObjectByName('camera_splines').children) {
            self.scene.getObjectByName('camera_splines').children.forEach((obj) => {
                if (obj.isLine) {
                    // Convert into curve
                    const curve = lineToCurve(obj)
                    // Add the curve into curves list
                    self.cameraCurves.push(curve)
                }
            })
        }
        // Remove splines from scene
        self.scene.remove(self.scene.getObjectByName('camera_splines'))

        // Display curves
        /*
        self.cameraCurves.forEach((curve => {
            self.displayCurve(self, {curve})
        }))
         */

        // Set camera positions
        self.cameraManager.cameras[0].rotation.y = MathUtils.degToRad(-90)

        // ---------------- //
        // Sound
        // ---------------- //

        // Add sound to camera
        self.soundManager.addToCamera(self.cameraManager.camera);

        // Fog
        self.scene.fog = new THREE.Fog(0x000000, 200, 1000);


        // --- METHODS

        /**
         * Follow the curve with camera
         * @param self
         * @param camera
         * @param callback
         */
        self.followCurve = (self, {curveName, cameraIndex, duration}, callback) => {
            if (self.camPosIndex >= duration) {
                callback(self)
                self.camPosIndex = 0
                return
            }

            const curve = self.cameraCurves.find((curve) => curve.name === curveName)

            const camPos = curve.getPointAt(self.camPosIndex / duration);
            // const camRot = curve.getTangentAt(self.camPosIndex / duration);

            self.cameraManager.cameraObjects[cameraIndex].camera.position.x = (camPos.x)
            self.cameraManager.cameraObjects[cameraIndex].camera.position.y = (camPos.y)
            self.cameraManager.cameraObjects[cameraIndex].camera.position.z = (camPos.z)

            self.camPosIndex += 1
        }

        /**
         * Frame target
         * @param self
         * @param target
         * @param threshold
         * @param camera
         * @param onComplete
         */
        self.frameTarget = (self, {target, threshold, camera, onComplete}) => {

            const dir = camera.getWorldDirection(new THREE.Vector3(0, 0, 0))
            const distance = dir.distanceTo(target)

            EventManager.publish('camera:aiming', {distance, threshold: threshold, aiming: distance <= threshold})

            if(distance <= threshold) {
                if(self.cameraProgress < 100) {
                    self.cameraProgress += 0.5
                }else{
                    EventManager.publish('camera:progress_complete')
                    EventManager.publish('camera:aiming', {distance, threshold: threshold, aiming: false})
                    onComplete(self)
                }
                EventManager.publish('camera:progress', self.cameraProgress)
            }else {
                self.cameraProgress = 0
                EventManager.publish('camera:progress', self.cameraProgress)
            }
        }

        if(typeof self.sequences[self.currentSequence].init === 'function') self.sequences[self.currentSequence].init(self)
    },
    onUpdate: (self) => {
        if (typeof self.sequences[self.currentSequence].update === 'function') self.sequences[self.currentSequence].update(self)
    }

})
