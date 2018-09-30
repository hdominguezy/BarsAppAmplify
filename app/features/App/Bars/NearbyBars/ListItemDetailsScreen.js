import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
  ScrollView,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Auth } from 'aws-amplify';

// Components
import ListItemDetails from './containers/ListItemDetails';
import MapLinks from '../../../../components/MapLinks';
// import Button from '../../../../components/Button';

// Util
import nearbyPlaceDetailsSearch from '../../../../services/nearbyPlaceDetailsSearch';

// Config
import * as COLORS from '../../../../config/colors';

export default class ListItemDetailsScreen extends PureComponent {
  static propTypes = {
    navigation: PropTypes.shape({
      navigate: PropTypes.func.isRequired,
      getParam: PropTypes.func.isRequired,
    }).isRequired,
  };

  static navigationOptions = {
    headerStyle: {
      backgroundColor: COLORS.DEFAULT_PRIMARY_COLOR,
    },
    headerTintColor: COLORS.TEXT_PRIMARY_COLOR,
  };

  animatedValue = new Animated.Value(0);

  animatedButtonStyle = {
    opacity: this.animatedValue,
    transform: [{ scale: this.animatedValue }],
  };

  state = {
    details: {},
    userId: '',
    isVisible: false,
    loading: false,
  };

  componentDidMount() {
    this.getAllDetails();
  }

  animateButton = () => {
    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };

  getAllDetails = async () => {
    try {
      this.setState({ loading: true });
      const { navigation } = this.props;
      const placeId = navigation.getParam('bar').place_id;
      const response = await nearbyPlaceDetailsSearch(placeId);
      const currentUser = await Auth.currentAuthenticatedUser();
      const userId = await currentUser.signInUserSession.accessToken.payload.sub;
      this.setState({ details: response.data.result, userId, loading: false });
      this.animateButton();
      console.log(response);
      console.log(userId);
    } catch (error) {
      this.setState({ loading: false });
      console.log(error);
    }
  };

  openWebsiteLink = () => {
    try {
      const {
        details: { website },
      } = this.state;
      const supported = Linking.canOpenURL(website);
      if (supported) {
        Linking.openURL(website);
        console.log(website);
      } else {
        console.log('Website url not valid.');
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  openPhone = () => {
    try {
      const { details } = this.state;
      const phone = details.formatted_phone_number;
      Linking.openURL(`tel://${phone}`);
      console.log(phone);
    } catch (error) {
      console.log(error);
    }
  };

  toggleMapLinks = () => {
    this.setState(prevState => ({ isVisible: !prevState.isVisible }));
  };

  render() {
    const { navigation } = this.props;
    const barId = navigation.getParam('bar').place_id;
    const { lat, lng } = navigation.getParam('bar').geometry.location;
    const {
      details, isVisible, loading, userId,
    } = this.state;

    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.PRIMARY_TEXT_COLOR} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.containerContentStyle}>
          <ListItemDetails
            barId={barId}
            lat={lat}
            lng={lng}
            details={details}
            userId={userId}
            openWebsiteLink={this.openWebsiteLink}
            openPhone={this.openPhone}
            toggleMapLinks={this.toggleMapLinks}
          />
          <MapLinks
            isVisible={isVisible}
            onCancelPressed={this.toggleMapLinks}
            onAppPressed={this.toggleMapLinks}
            onBackButtonPressed={this.toggleMapLinks}
            name={details.name}
            lat={lat}
            lng={lng}
            barId={barId}
          />
        </ScrollView>
        {/* <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: COLORS.ACCENT_COLOR,
            marginBottom: 0,
            borderRadius: 0,
            width: Dimensions.get('window').width,
          }}
          textStyle={{ color: COLORS.TEXT_PRIMARY_COLOR }}
        /> */}
        <Animated.View style={[styles.buttonContainer, this.animatedButtonStyle]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_COLOR,
  },
  containerContentStyle: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  loading: {
    paddingTop: 20,
  },
  buttonContainer: {
    backgroundColor: COLORS.ACCENT_COLOR,
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 10,
    paddingBottom: 10,
    width: Dimensions.get('window').width,
  },
  buttonText: {
    color: COLORS.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 2,
  },
});
