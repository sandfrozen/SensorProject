import React, { Component } from 'react';
import { Text, View, Button, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TabNavigator, TabBarBottom, TabBarTop } from 'react-navigation';
import { Constants, Accelerometer, Gyroscope, Location, Permissions } from 'expo';

class GpsScreen extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      latitude: 0,
      longitude: 0,
      altitude: 0,
      error: null,
    };
  }

  convertLat(lat) {
    var latitude = this.toDegreesMinutesAndSeconds(lat);
    var latitudeCardinal = Math.sign(lat) >= 0 ? "N" : "S";

    return latitude + " " + latitudeCardinal;
  };

  convertLon(lng) {
    var longitude = this.toDegreesMinutesAndSeconds(lng);
    var longitudeCardinal = Math.sign(lng) >= 0 ? "E" : "W";

    return longitude + " " + longitudeCardinal;
  };

  toDegreesMinutesAndSeconds(coordinate) {
    var absolute = Math.abs(coordinate)
    var degrees = Math.floor(absolute);
    var minutesNotTruncated = (absolute - degrees) * 60;
    var minutes = Math.floor(minutesNotTruncated);
    var seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return degrees + "° " + minutes + "\' " + seconds + "\"";
  };

  componentDidMount() {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          error: null,
        });
        //console.log("Auto GPS:\n" + JSON.stringify(position.coords))
      },
      (error) => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 },
    );
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  manualGps = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
        });
        //console.log("Manual GPS:\n" + JSON.stringify(position.coords))
      },
      (error) => this.setState({ error: error.message }),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
    );
  }



  render() {
    return (
      <View style={styles.main}>

        <View style={styles.container}>
          <View style={styles.sideContainer}>
            <Text>Latitude:</Text>
            <Text>{this.state.longitude}</Text>
            <Text>{this.convertLat(this.state.latitude)}</Text>
          </View>
          <View style={styles.sideContainer}>
            <Text>Longitude:</Text>
            <Text>{this.state.longitude}</Text>
            <Text>{this.convertLon(this.state.longitude)}</Text>
          </View>
        </View>
        <Text>Alti: {this.state.altitude.toFixed(1)} m.</Text>

        <View style={styles.bottomContainer}>
          <Button title="Refresh GPS"
            onPress={this.manualGps} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',

    // borderColor: 'green',
    // borderWidth: 1
  },


  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 2,

    // borderColor: 'black',
    // borderWidth: 1
  },

  sideContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '50%',
    padding: 10,

    // borderColor: 'blue',
    // borderWidth: 1,
  },

  bottomContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',

    // borderColor: 'red',
    // borderWidth: 1
  },
})

class AccelerometerScreen extends React.Component {
  state = {
    accelerometerData: { x: 0, y: 0, z: 0 }
  };

  componentWillUnmount() {
    this._unsubscribeFromAccelerometer();
  }

  componentDidMount() {
    this._subscribeToAccelerometer();
  }

  _subscribeToAccelerometer = () => {
    this._acceleroMeterSubscription = Accelerometer.addListener(accelerometerData =>
      this.setState({ accelerometerData })
    );
  };

  _unsubscribeFromAccelerometer = () => {
    this._acceleroMeterSubscription && this._acceleroMeterSubscription.remove();
    this._acceleroMeterSubscription = null;
  };

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Accelerometer:</Text>
        <View style={styles.sensor}>
          <Text>
            x: {this.state.accelerometerData.x.toFixed(1)}
          </Text>
          <Text>
            y: {this.state.accelerometerData.y.toFixed(1)}
          </Text>
          <Text>
            z: {this.state.accelerometerData.z.toFixed(1)}
          </Text>
        </View>
      </View>
    );
  }
}

class GyroscopeScreen extends React.Component {

  state = {
    gyroscopeData: {},
  }

  componentDidMount() {
    this._toggle();
    Gyroscope.setUpdateInterval(100);
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  _toggle = () => {
    if (this._subscription) {
      this._unsubscribe();
    } else {
      this._subscribe();
    }
  }

  _subscribe = () => {
    this._subscription = Gyroscope.addListener((result) => {
      this.setState({ gyroscopeData: result });
    });
  }

  _unsubscribe = () => {
    this._subscription && this._subscription.remove();
    this._subscription = null;
  }

  round(n) {
    if (!n) {
      return 0;
    }

    return Math.floor(n * 10) / 10;
  }


  render() {
    let { x, y, z } = this.state.gyroscopeData;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Gyroscope:</Text>
        <View style={styles.sensor}>
          <Text>x: {this.round(x)}</Text>
          <Text>y: {this.round(y)}</Text>
          <Text>z: {this.round(z)}</Text>
        </View>
      </View>
    );
  }
}

const degree_update_rate = 3;

class CompassScreen extends Component {
  state = {
    magHeading: 0,
    trueHeading: 0,
  };

  componentDidMount() {
    Location.watchHeadingAsync((heading) => {
      this.setState({
        magHeading: heading.magHeading,
        trueHeading: heading.trueHeading,
      });
    });
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Compass:</Text>
        <Text>
          {this.state.magHeading.toFixed(1)}
        </Text>
        <Text>
          {this.state.trueHeading.toFixed(1)}
        </Text>
      </View>
    );
  }
}

export default TabNavigator(
  {
    GPS: { screen: GpsScreen },
    Accelerometer: { screen: AccelerometerScreen },
    Gyroscope: { screen: GyroscopeScreen },
    Compass: { screen: CompassScreen },
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === 'GPS') {
          iconName = `ios-locate${focused ? '' : '-outline'}`;
        } else if (routeName === 'Accelerometer') {
          iconName = `ios-speedometer${focused ? '' : '-outline'}`;
        } else if (routeName === 'Gyroscope') {
          iconName = `ios-analytics${focused ? '' : '-outline'}`;
        } else if (routeName === 'Compass') {
          iconName = `ios-compass${focused ? '' : '-outline'}`;
        }

        // You can return any component that you like here! We usually use an
        // icon component from react-native-vector-icons
        return <Ionicons name={iconName} size={25} color={tintColor} />;
      },
    }),
    tabBarOptions: {
      activeTintColor: '#003399',
      inactiveTintColor: 'gray',
    },
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom',
    animationEnabled: true,
    swipeEnabled: true,
  }

);