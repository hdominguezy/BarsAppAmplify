import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  Linking,
  SegmentedControlIOS,
  StyleSheet,
} from 'react-native';
import gql from 'graphql-tag';
import { graphql, compose } from 'react-apollo';
import _ from 'lodash';
import moment from 'moment';
import Swipeout from 'react-native-swipeout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Foundation from 'react-native-vector-icons/Foundation';
import MapLinks from './MapLinks';

// GraphQL
import ListBars from '../graphql/queries/ListBars';
import GetUserBars from '../graphql/queries/GetUserBars';
import GetBarMember from '../graphql/queries/GetBarMember';
import CreateBarMember from '../graphql/mutations/CreateBarMember';
import UpdateBar from '../graphql/mutations/UpdateBar';

// Util
import orderData from '../util/orderData';

// Config
import * as COLORS from '../config/colors';

class AllBarsList extends Component {
  static navigationOptions = {
    header: null,
  };

  state = {
    isVisible: false,
    options: ['Name', 'Created At'],
    selectedIndex: 0,
    property: 'name',
    direction: 'asc',
  };

  openWebsiteLink = (website) => {
    try {
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

  openPhone = (phone) => {
    try {
      Linking.openURL(`tel://${phone}`);
      console.log(phone);
    } catch (error) {
      console.log(error);
    }
  };

  toggleMapLinks = () => {
    this.setState(prevState => ({ isVisible: !prevState.isVisible }));
  };

  toggleBarSortOrder = (event) => {
    const { options } = this.state;
    this.setState({
      property: _.camelCase(options[event.nativeEvent.selectedSegmentIndex]),
    });
    console.log(event.nativeEvent);
  };

  addToUserFavourites = async (bar) => {
    try {
      const {
        userId,
        getBarMember,
        createBarMember,
        updateBar,
      } = this.props;

      const {
        id,
        name,
        phone,
        location,
        lat,
        lng,
        url,
        website,
        addedBy,
      } = bar;

      const barData = {
        id,
        name,
        phone,
        location,
        lat,
        lng,
        url,
        website,
        addedBy,
      };

      const barMember = {
        userId,
        barId: id,
      };

      if (getBarMember === null) {
        await Promise.all([
          createBarMember({ ...barMember }),
          updateBar({ ...barData }),
        ]);
        Alert.alert(
          'Success',
          'This bar has been added to your favourites.',
          [{ text: 'OK' }],
          {
            cancelable: false,
          },
        );
      } else if (getBarMember !== null) {
        Alert.alert(
          'Already added',
          'This bar is already in your favourites.',
          [{ text: 'OK' }],
          {
            cancelable: false,
          },
        );
      }
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Error',
        'There was an error, please try again.',
        [{ text: 'OK' }],
        {
          cancelable: false,
        },
      );
    }
  };

  renderItem = ({ item }) => {
    const { isVisible } = this.state;
    const swipeoutBtns = [
      {
        backgroundColor: COLORS.ACCENT_COLOR,
        onPress: () => this.addToUserFavourites(item),
        text: 'LIKE',
      },
    ];
    const date = moment.utc(item.createdAt).format('MMMM Do YYYY, h:mm:ss a');
    return (
      <Swipeout
        right={swipeoutBtns}
        backgroundColor={COLORS.TEXT_PRIMARY_COLOR}
        autoClose
      >
        <View style={styles.card}>
          <View style={styles.details}>
            <Text style={styles.header}>{item.name}</Text>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
            <Text style={styles.date}>{`Added on ${date}`}</Text>
          </View>
          <View style={styles.iconWrapper}>
            <TouchableOpacity
              onPress={() => this.openWebsiteLink(item.website)}
            >
              <MaterialCommunityIcons
                name="web"
                size={18}
                color={COLORS.ACCENT_COLOR}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={this.toggleMapLinks}>
              <MaterialCommunityIcons
                name="directions"
                size={18}
                color={COLORS.DARK_PRIMARY_COLOR}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.openPhone(item.phone)}>
              <Foundation
                name="telephone"
                size={18}
                color={COLORS.PRIMARY_TEXT_COLOR}
              />
            </TouchableOpacity>
          </View>
          <MapLinks
            isVisible={isVisible}
            onCancelPressed={this.toggleMapLinks}
            onAppPressed={this.toggleMapLinks}
            onBackButtonPressed={this.toggleMapLinks}
            name={item.name}
            lat={parseFloat(item.lat)}
            lng={parseFloat(item.lng)}
            barId={item.id}
          />
        </View>
      </Swipeout>
    );
  };

  renderSeparator = () => <View style={styles.separator} />;

  render() {
    const { refetch, networkStatus, bars } = this.props;
    const {
      property,
      direction,
      options,
      selectedIndex,
    } = this.state;

    return (
      <View style={styles.container}>
        <View style={styles.flatListWrapper}>
          <FlatList
            data={orderData(bars, property, direction)}
            renderItem={this.renderItem}
            keyExtractor={item => item.id}
            onRefresh={() => refetch()}
            refreshing={networkStatus === 4}
            ItemSeparatorComponent={this.renderSeparator}
          />
        </View>
        <View style={styles.segmentedControlWrapper}>
          <SegmentedControlIOS
            values={options}
            tintColor={COLORS.DEFAULT_PRIMARY_COLOR}
            selectedIndex={selectedIndex}
            onChange={event => this.toggleBarSortOrder(event)}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loading: {
    paddingTop: 20,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  details: {
    width: '90%',
  },
  header: {
    fontSize: 18,
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
  },
  phone: {
    fontSize: 10,
  },
  date: {
    fontSize: 10,
    color: COLORS.SECONDARY_TEXT_COLOR,
  },
  iconWrapper: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  separator: {
    backgroundColor: COLORS.DIVIDER_COLOR,
    height: StyleSheet.hairlineWidth,
  },
  flatListWrapper: {
    flex: 1,
    marginBottom: 30,
  },
  segmentedControlWrapper: {
    backgroundColor: COLORS.TEXT_PRIMARY_COLOR,
    paddingHorizontal: 10,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

AllBarsList.propTypes = {
  bars: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  refetch: PropTypes.func.isRequired,
  networkStatus: PropTypes.number.isRequired,
};

export default compose(
  graphql(gql(ListBars), {
    options: {
      fetchPolicy: 'network-only',
      notifyOnNetworkStatusChange: true,
    },
    props: ({ data }) => ({
      listBars: data,
      bars: data.listBars ? data.listBars.items : [],
      refetch: data.refetch,
      networkStatus: data.networkStatus,
    }),
  }),
  graphql(gql(GetBarMember), {
    options: ownProps => ({
      variables: {
        userId: ownProps.userId,
        barId: ownProps.id,
      },
      fetchPolicy: 'network-only',
    }),
    props: ({ data }) => ({
      getBarMember: data.getBarMember ? data.getBarMember : null,
    }),
  }),
  graphql(gql(CreateBarMember), {
    options: {
      fetchPolicy: 'network-only',
    },
    props: ({ mutate }) => ({
      createBarMember: member => mutate({
        variables: member,
        refetchQueries: [{ query: gql(GetUserBars), variables: { id: member.userId } }],
      }),
    }),
  }),
  graphql(gql(UpdateBar), {
    options: {
      fetchPolicy: 'network-only',
    },
    props: ({ mutate }) => ({
      updateBar: barData => mutate({ variables: barData }),
    }),
  }),
)(AllBarsList);
