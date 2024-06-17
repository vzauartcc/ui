// Import axios if you're making API calls
import { zabApi, vatusaApi } from '../helpers/axios';

export default {
  namespaced: true,
  state: () => ({
    controllers: [],
    trainingProgress: [],
    trainingModules: [],
  }),
  getters: {
    requestedTrainingTrainees(state) {
      // Filter trainees based on the status of the first module in modulesInProgress
      return state.trainingProgress.filter(trainee => {
        if (trainee.modulesInProgress.length > 0) {
          return trainee.modulesInProgress[0].status === 1;
        } else {
          return false; // Handle cases where modulesInProgress is empty
        }
      });
    },
    inTrainingTrainees(state) {
      return state.trainingProgress.filter(trainee => {
        if (trainee.modulesInProgress.length > 0) {
          return trainee.modulesInProgress[0].status === 2;
        } else {
          return false;
        }
      });
    },
    notInTraining(state, getters) {
      console.log("Requested Training Trainees:", getters.requestedTrainingTrainees);
      console.log("In Training Trainees:", getters.inTrainingTrainees);
      console.log("All Controllers:", state.controllers);
      
      const activeTraineeIds = [...getters.requestedTrainingTrainees, ...getters.inTrainingTrainees].map(t => t.cid);
      console.log("Active Trainee IDs:", activeTraineeIds);
      
      const notInTrainingControllers = state.controllers.filter(controller => !activeTraineeIds.includes(controller.cid));
      console.log("Controllers Not in Training:", notInTrainingControllers);
    
      return notInTrainingControllers;
    },
    cooldownTrainees(state) {
      return state.trainingProgress.filter(trainee => {
        if (trainee.modulesInProgress.length > 0) {
          return trainee.modulesInProgress[0].status === 4;
        } else {
          return false;
        }
      });
    },
    matchTraineesWithControllers: (state) => (trainees) => {
      return trainees.map((trainee) => {
        const matchingController = state.controllers.find(controller => controller.cid === trainee.cid);
        return matchingController ? { ...trainee, ...matchingController } : trainee;
      });
    },
  
    // Specific getters for different trainee groups
    matchedRequestedTrainingTrainees: (state, getters) => {
      return getters.matchTraineesWithControllers(getters.requestedTrainingTrainees || []);
    },
    matchedInTrainingTrainees: (state, getters) => {
      return getters.matchTraineesWithControllers(getters.inTrainingTrainees || []);
    },
    matchedNotInTrainingTrainees: (state, getters) => {
      return getters.matchTraineesWithControllers(getters.notInTrainingTrainees || []);
    },
    matchedCooldownTrainees: (state, getters) => {
      return getters.matchTraineesWithControllers(getters.cooldownTrainees || []);
    },
    getModuleById: (state) => (moduleId) => {
      return state.trainingModules.find(module => module._id === moduleId);
    },
  },
  actions: {
    async fetchActiveControllers({ commit }) {
      try {
        const response = await zabApi.get('controller/active');
        if (response.data.ret_det.code === 200) {
          commit('setControllers', response.data.data);
        } else {
          commit('setError', 'Failed to fetch controllers');
        }
      } catch (error) {
        commit('setError', error.toString());
      }
    },
    async fetchTrainingProgress({ commit }) {
      // Example API call
      const response = await zabApi.get('/training/training-progress');
      commit('setTrainingProgress', response.data.data);
    },
    updateTraineeStatusAction({ commit }, payload) {
      commit('updateTraineeStatus', payload);
    },
    async fetchTrainingModules({ commit }) {
      try {
        const response = await zabApi.get('/training/modules'); // Adjust the URL as necessary
        if (response.data.ret_det.code === 200) {
          commit('setTrainingModules', response.data.data);
        } else {
          commit('setError', 'Failed to fetch training modules');
        }
      } catch (error) {
        commit('setError', error.toString());
      }
    },
  },
  mutations: {
    setControllers(state, controllers) {
      state.controllers = controllers;
    },
    setTrainingProgress(state, trainingProgressData) {
      // Assuming trainingProgressData is an array of training progress objects
      state.trainingProgress = trainingProgressData.map(item => {
        return {
          cid: item.cid,
          modulesInProgress: item.modulesInProgress,
          completedModules: item.completedModules,
          exams: item.exams,
        };
      });
    },
    setTrainingModules(state, modules) {
      state.trainingModules = modules;
    },
    setError(state, errorMessage) {
      state.error = errorMessage;
    },
    updateTraineeStatus(state, payload) {
      console.log("Payload received:", payload);
      const traineeIndex = state.trainingProgress.findIndex(trainee => trainee.cid === payload.cid);
      console.log("Trainee index:", traineeIndex);
      if (traineeIndex !== -1) {
        const moduleIndex = state.trainingProgress[traineeIndex].modulesInProgress.findIndex(module => module.moduleId._id === payload.moduleInProgressUpdate.moduleId);
        console.log("Module index:", moduleIndex);
        if (moduleIndex !== -1) {
          state.trainingProgress[traineeIndex].modulesInProgress[moduleIndex].status = payload.moduleInProgressUpdate.status;
          state.trainingProgress[traineeIndex].modulesInProgress[moduleIndex].trainingTeam = payload.moduleInProgressUpdate.trainingTeam;
        }
      }
    },
  },
};
