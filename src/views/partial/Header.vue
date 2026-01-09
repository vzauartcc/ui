<template>
	<header>
		<div id="header_hero" :class="`hero${number === 69 ? '_aprilfools' : '6'}`">
			<div class="wrapper">
				<div>
					<router-link to="/"
						><img
							class="mainLogo"
							:src="`https://zauartcc.sfo3.digitaloceanspaces.com/${folderPrefix}/site-logo/Main-Logo.png`"
							draggable="false"
							height="165"
					/></router-link>
				</div>
			</div>
		</div>
		<nav>
			<div class="nav-wrapper wrapper">
				<ul class="left hide-on-med-and-down">
					<li>
						<router-link to="/">HOME</router-link>
					</li>
					<li class="has_dropdown" data-state="hide">
						<a class="dropdown-left" href="#!" data-target="controllers-dropdown">CONTROLLERS</a>
						<ul id="controllers-dropdown" class="dropdown-content">
							<li>
								<router-link to="/controllers">Controller Roster</router-link>
							</li>
							<li>
								<router-link to="/controllers/staff">ARTCC Staff</router-link>
							</li>
						</ul>
					</li>
					<li>
						<router-link to="/events">EVENTS</router-link>
					</li>
					<li>
						<router-link to="/news">NEWS</router-link>
					</li>
					<li class="has_dropdown" data-state="hide">
						<a class="dropdown-left" href="#!" data-target="links-dropdown">LINKS</a>
						<ul id="links-dropdown" class="dropdown-content">
							<li>
								<a href="https://charts.zauartcc.org" target="_blank" rel="noopener noreferrer"
									>ZAU Charts</a
								>
							</li>
							<li>
								<a
									:href="window.location.protocol + '//' + window.location.host + '/charts.html'"
									target="_blank"
									rel="noopener noreferrer"
									>ZAU Charts (Backup link)</a
								>
							</li>
							<li>
								<a href="https://skyvector.com/" target="_blank" rel="noopener noreferrer"
									>SkyVector</a
								>
							</li>
							<li>
								<a
									href="https://flightaware.com/statistics/ifr-route/"
									target="_blank"
									rel="noopener noreferrer"
									>FlightAware</a
								>
							</li>
							<li>
								<a href="https://www.airnav.com/" target="_blank" rel="noopener noreferrer"
									>AirNav</a
								>
							</li>
							<li>
								<a href="https://atis.info/" target="_blank" rel="noopener noreferrer">DATIS</a>
							</li>
							<li class="divider"></li>
							<li>
								<a href="https://www.vatsim.net/" target="_blank" rel="noopener noreferrer"
									>VATSIM Home</a
								>
							</li>
							<li>
								<a href="https://www.vatusa.net/" target="_blank" rel="noopener noreferrer"
									>VATUSA Home</a
								>
							</li>
							<li>
								<a href="https://map.vatsim.net/" target="_blank" rel="noopener noreferrer"
									>VATSIM Map</a
								>
							</li>
							<li>
								<a href="https://www.vnas.vatsim.net/" target="_blank" rel="noopener noreferrer"
									>vNAS</a
								>
							</li>
						</ul>
					</li>
					<li class="has_dropdown" data-state="hide">
						<a class="dropdown-left" href="#!" data-target="files-dropdown">FILES</a>
						<ul id="files-dropdown" class="dropdown-content">
							<li>
								<router-link to="/files/documents">Documents</router-link>
							</li>
							<li>
								<router-link to="/files/downloads">Downloads</router-link>
							</li>
						</ul>
					</li>
					<li>
						<router-link to="/feedback">FEEDBACK</router-link>
					</li>
					<li>
						<router-link to="/staffingRequest">REQUEST STAFFING</router-link>
					</li>
					<li>
						<router-link to="/split">SPLIT MAP</router-link>
					</li>
				</ul>
				<router-link to="#" data-target="mobile-menu" class="sidenav-trigger"
					><i class="material-icons">menu</i></router-link
				>
				<ul class="right left-on-med-and-down">
					<li>
						<a
							v-show="user.isLoggedIn"
							class="dropdown-notif nav_notifications"
							href="#!"
							data-target="notifications-dropdown"
							><i class="material-icons">notifications</i>
							<div v-if="unread" class="new_notification"></div
						></a>
						<ul v-show="user.isLoggedIn" id="notifications-dropdown" class="dropdown-content">
							<Notifications v-if="user.isLoggedIn" />
						</ul>
					</li>
					<li class="user">
						<a
							v-show="user.isLoggedIn"
							class="dropdown-right user_name"
							href="#!"
							data-target="user-dropdown"
							>{{ user.isLoggedIn ? `${user.data.fname} ${user.data.lname}` : '...'
							}}<i class="material-icons user_dropdown_arrow">arrow_drop_down</i></a
						>
						<a v-if="!user.isLoggedIn" id="login_button" @click.prevent="processLogin" href="#"
							>Login</a
						>
						<ul v-show="user.isLoggedIn" id="user-dropdown" class="dropdown-content">
							<li v-if="user.isLoggedIn && user.data.isMember">
								<router-link to="/dash">Controller Dashboard</router-link>
							</li>
							<li v-else>
								<router-link to="/controllers/visit">Become a Visitor</router-link>
							</li>
							<!--ADD THIS BACK ONCE IDS IS OPERATIONAL-->
							<!--<li v-if="user.isLoggedIn && user.data.isMember">
              <a href="https://ids.zauartcc.org" target="_blank" rel="noopener noreferrer">IDS</a>
              </li>-->
							<li
								v-if="user.isLoggedIn && (user.data.isTrainingStaff || user.data.isStaff)"
								class="divider"
							></li>
							<li v-if="user.isLoggedIn && user.data.isStaff">
								<a href="https://mail.zoho.com/" target="_blank" rel="noopener noreferrer"
									>Webmail</a
								>
							</li>
							<li v-if="user.isLoggedIn && user.data.isTrainingStaff">
								<router-link to="/ins">Instructor Dashboard</router-link>
							</li>
							<li v-if="user.isLoggedIn && user.data.isStaff">
								<router-link to="/admin">Admin Dashboard</router-link>
							</li>
							<li class="divider"></li>
							<li>
								<a @click.prevent="processLogout" href="#">Logout</a>
							</li>
						</ul>
					</li>
				</ul>
			</div>
		</nav>

		<ul class="sidenav" id="mobile-menu">
			<li>
				<router-link class="sidenav-close" to="/">HOME</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/controllers">ROSTER</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/files/documents">DOCUMENTS</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/files/downloads">DOWNLOADS</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/controllers/staff">STAFF</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/events">EVENTS</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/news">NEWS</router-link>
			</li>
			<!-- <li>
        <router-link class="sidenav-close" to="/briefing">PILOT BRIEFING</router-link>
      </li> -->
			<li>
				<router-link class="sidenav-close" to="/feedback">FEEDBACK</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/staffingRequest">REQUEST STAFFING</router-link>
			</li>
			<li>
				<router-link class="sidenav-close" to="/split">SPLIT MAP</router-link>
			</li>
		</ul>
	</header>
</template>

<script>
import { vatsimAuthRedirectUrl } from '@/helpers/uriHelper.js';
import { mapActions, mapMutations, mapState } from 'vuex';
import Notifications from './Notifications.vue';

export default {
	data() {
		return {
			folderPrefix: window.env.VITE_FOLDER_PREFIX, // ✅ Now it's available inside the component
			number: 0,
			unread: false,
			window: window,
		};
	},
	components: {
		Notifications,
	},
	methods: {
		...mapMutations('user', ['setUser', 'setRedirect']),
		...mapActions('user', ['logout']),
		async processLogin() {
			localStorage.setItem('redirect', this.$route.path);
			window.location.href = vatsimAuthRedirectUrl;
		},
		async processLogout() {
			await this.logout();
			this.toastInfo('Successfully logged out');
			if (this.$route.meta.isAdmin || this.$route.meta.isAdmin || this.$route.meta.loggedIn)
				this.$router.push('/');
		},
	},
	computed: {
		...mapState('user', ['user']),
	},
	async mounted() {
		this.number = Math.floor(Math.random() * 200);
		M.Dropdown.init(document.querySelectorAll('.dropdown-right'), {
			alignment: 'right',
			coverTrigger: false,
			constrainWidth: false,
		});
		M.Dropdown.init(document.querySelectorAll('.dropdown-notif'), {
			alignment: 'right',
			coverTrigger: false,
			constrainWidth: false,
			closeOnClick: false,
		});
		M.Dropdown.init(document.querySelectorAll('.dropdown-left'), {
			alignment: 'left',
			coverTrigger: false,
			constrainWidth: false,
		});
		M.Sidenav.init(document.querySelectorAll('.sidenav'), {
			edge: 'right',
		});
	},
};
</script>

<style scoped lang="scss">
#header_hero {
	background-size: cover;
	background-position: bottom 57% right 50%;
	background-repeat: no-repeat;
	max-width: 3840px;
	height: 300px;
	position: relative;
	resize: none;
	display: flex;
	flex: inline-block;

	&::before {
		background: rgba($primary-color, 0);
		height: 100%;
		width: 100%;
		left: 0;
		top: 0;
		content: '';
		position: absolute;
	}

	&.hero1 {
		background-image: url('@/assets/images/hero/grand_canyon.jpg');
		background-position: top 40% center;
	}

	&.hero2 {
		background-image: url('@/assets/images/hero/scaled/camelback.jpg');
		background-position: top 40% center;
	}

	&.hero3 {
		background-image: url('@/assets/images/hero/saguaro.jpg');
		background-position: top 40% center;
	}

	&.hero4 {
		background-image: url('@/assets/images/hero/abq.jpg');
		background-position: top 40% center;
	}

	&.hero5 {
		background-image: url('@/assets/images/hero/cactus.jpg');
		background-position: top 40% center;
	}

	&.hero6 {
		background-image: url('@/assets/images/hero/sandias.jpg');
	}

	&.hero_aprilfools {
		background-image: url('@/assets/images/hero/bb.jpg');
	}

	.wrapper {
		padding: 2em 1em;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;

		a {
			display: block;

			img {
				height: 200px;
			}
		}

		h1 {
			font-weight: 600;
			margin: 0;
			font-size: 3rem;
			color: #41b6e6;
			text-shadow: -1px -1px 1.5px $primary-color-light;

			span {
				display: block;
				margin-left: 50%;
				font-size: 1.8rem;
				font-weight: 400;
			}
		}
	}
}

nav {
	background-color: #e4002b;
}

.user_dropdown_arrow {
	display: inline-block;
	display: inline-flex;
	vertical-align: top;
	font-size: 22px;
	margin-top: 1px;
	margin-left: -1px;
}

.nav_notifications {
	padding: 1px 0 0 0;
	transition: 0.3s ease;
	position: relative;

	&:hover {
		background: transparent;
		color: rgb(220, 220, 220);
	}

	i {
		font-size: 20px;
	}

	.new_notification {
		height: 7px;
		width: 7px;
		background-color: $secondary-color-dark;
		border-radius: 50%;
		position: absolute;
		top: 25px;
		left: 11px;
	}
}

#notifications-dropdown {
	color: $primary-color;
	line-height: 1.1em;
	padding: 1em 1em 0.5em 1em;
	overflow: hidden;
}

.user_name {
	transition: 0.3s ease;

	&:hover {
		background: transparent;
		color: rgb(220, 220, 220);
	}
}

@media screen and (max-width: 910px) {
	#header_hero .wrapper {
		padding: 15px;

		a img {
			height: 80px;
			width: auto;
		}

		h1 {
			font-size: 32px;
			margin: 20px 0 0 0;

			span {
				font-size: 24px;
			}
		}
	}
}
</style>
