<template>
  <div class="trip">
    <vue-headful title="Mis viajes" description="Pagina de mis viajes" />

    <!-- MENU -->
    <menucustom></menucustom>

    <!--  SIMBOLO DE CARGA  -->
    <div v-show="loading" class="lds-roller">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>

    <section v-show="!loading">
      <h1>Viajes a los que te has unido:</h1>
      <showtripslist :trips="trips"></showtripslist>
    </section>

    <section v-show="!loading">
      <h1>Viajes hosteados por mi:</h1>
      <div v-for="trip in tripsHosted" :key="trip.id">
        <p>
          <router-link :to=" {name:'TripView', params:{id:trip.id}} ">{{trip.locality}}</router-link>
        </p>
        <p>Descripcion: {{trip.description}}</p>
        <p>Lugar: {{trip.budget}}</p>
        <p>Fecha: {{trip.date}}</p>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import Swal from "sweetalert2";
//IMPORTANDO MENU
import menucustom from "@/components/MenuCustom.vue";
import showtripslist from "@/components/ShowTripsList.vue";
export default {
  name: "UserTrips",
  components: { menucustom, showtripslist },
  data() {
    return {
      loading: true,
      id: "",
      trips: [],
      tripsHosted: []
    };
  },
  methods: {
    getUserTrips() {
      let self = this;
      self.id = localStorage.getItem("userID");
      axios
        .get("http://localhost:3001/trips/usertrips/" + self.id)
        .then(function(response) {
          //TIEMPO DE CARGA
          setTimeout(function() {
            self.loading = false;
            self.trips = response.data.data;
          }, 1000);
        })
        .catch(function(error) {
          if (error.response) {
            alert(error.response.data.message);
          }
        });
    },
    getUserTripsHosted() {
      let self = this;
      self.id = localStorage.getItem("userID");
      axios
        .get("http://localhost:3001/trips/usertripshosted/" + self.id)
        .then(function(response) {
          //TIEMPO DE CARGA
          setTimeout(function() {
            self.loading = false;
            self.tripsHosted = response.data.data;
            console.log(response.data.data);
          }, 1000);
        })
        .catch(function(error) {
          if (error.response) {
            alert(error.response.data.message);
          }
        });
    }
  },
  created() {
    this.getUserTrips();
    this.getUserTripsHosted();
  }
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  width: 100%;
}
.modalBox {
  background: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  color: black;
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
}
.vote {
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
}
.lds-roller {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 40px 40px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: cadetblue;
  margin: -4px 0 0 -4px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 63px;
  left: 63px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 68px;
  left: 56px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 71px;
  left: 48px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 72px;
  left: 40px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 71px;
  left: 32px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 68px;
  left: 24px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 63px;
  left: 17px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 56px;
  left: 12px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>