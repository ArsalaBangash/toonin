/* eslint-disable no-console */
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    connectedStatus: "disconnected",
    room: "",
    streamTitle: "",
    volume: 50,
    playing: false,
    rtcConn: null,
    peerID: null,
    stream: null
  },
  mutations: {
    SET_CONNECTED_STATUS: (state, payload) => {
      state.connectedStatus = payload;
    },
    SET_ROOM: (state, payload) => {
      state.room = payload;
    },
    SET_STREAM_TITLE: (state, payload) => {
      state.streamTitle = payload;
    },
    SET_VOLUME: (state, payload) => {
      state.volume = payload;
    },
    SET_PLAYING: (state, payload) => {
      state.playing = payload;
    },
    SET_RTCCONN: (state, payload) => {
      state.rtcConn = payload;
    },
    SET_PEERID: (state, payload) => {
      state.peerID = payload;
    },
    SET_STREAM: (state, payload) => {
      state.stream = payload;
    }
  },
  actions: {
    UPDATE_CONNECTED_STATUS: (context, payload) => {
      context.commit("SET_CONNECTED_STATUS", payload);
    },
    UPDATE_ROOM: (context, payload) => {
      context.commit("SET_ROOM", payload);
    },
    UPDATE_STREAM_TITLE: (context, payload) => {
      context.commit("SET_STREAM_TITLE", payload);
    },
    UPDATE_VOLUME: (context, payload) => {
      context.commit("SET_VOLUME", payload);
    },
    UPDATE_PLAYING: (context, payload) => {
      context.commit("SET_PLAYING", payload);
    },
    UPDATE_RTCCONN: (context, payload) => {
      context.commit("SET_RTCCONN", payload);
    },
    UPDATE_PEERID: (context, payload) => {
      context.commit("SET_PEERID", payload);
    },
    UPDATE_STREAM: (context, payload) => {
      context.commit("SET_STREAM", payload);
    }
  },
  getters: {
    CONNECTEDSTATUS: state => {
      return state.connectedStatus;
    },
    ROOM: state => {
      return state.room;
    },
    STREAMTITLE: state => {
      return state.streamTitle;
    },
    VOLUME: state => {
      return state.volume;
    },
    PLAYING: state => {
      return state.playing;
    },
    RTCCONN: state => {
      return state.rtcConn;
    },
    PEERID: state => {
      return state.peerID;
    },
    STREAM: state => {
      return state.stream;
    }
  }
});

export default store;
