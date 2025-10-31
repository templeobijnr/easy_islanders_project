import React from 'react';
import renderer from 'react-test-renderer';
import Card from '../Card';

describe('Card Snapshots', () => {
  test('renders default card', () => {
    const tree = renderer.create(<Card>Default Card</Card>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders elevated variant', () => {
    const tree = renderer.create(<Card variant="elevated">Elevated</Card>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders outlined variant', () => {
    const tree = renderer.create(<Card variant="outlined">Outlined</Card>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders filled variant', () => {
    const tree = renderer.create(<Card variant="filled">Filled</Card>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with hover disabled', () => {
    const tree = renderer.create(<Card hover={false}>No Hover</Card>).toJSON();
    expect(tree).toMatchSnapshot();
  });

  test('renders with motion variants', () => {
    const tree = renderer.create(
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
      >
        Motion Card
      </Card>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});