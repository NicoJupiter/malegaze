import {ID} from "../../js/utils";

export const mobile = {
    namespaced: true,
    state: {
        mobileId: null,
    },
    getters: {
        mobileUrl: (state) => {
            return state.mobileId !== null ? (process.env.VUE_APP_HTTPS === "true" ? 'https://' : 'http://') + process.env.VUE_APP_PUBLIC_HOST + (process.env.VUE_APP_PUBLIC_PORT ? ':' + process.env.VUE_APP_PUBLIC_PORT : '') + '/mobile/' + state.mobileId : null
        }
    },
    mutations: {
        generateMobileId(state) {
            state.mobileId = ID(9)
        },
        setMobileId(state, mobileId) {
            state.mobileId = mobileId
        }
    },
    actions: {
    },
}
