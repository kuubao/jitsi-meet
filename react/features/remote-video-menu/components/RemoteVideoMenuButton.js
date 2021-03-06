import React, { Component } from 'react';

/**
 * React {@code Component} for displaying an action in {@code RemoteVideoMenu}.
 *
 * @extends {Component}
 */
export default class RemoteVideoMenuButton extends Component {
    /**
     * {@code RemoteVideoMenuButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Text to display within the component that describes the onClick
         * action.
         */
        buttonText: React.PropTypes.string,

        /**
         * Additional CSS classes to add to the component.
         */
        displayClass: React.PropTypes.string,

        /**
         * The CSS classes for the icon that will display within the component.
         */
        iconClass: React.PropTypes.string,

        /**
         * The id attribute to be added to the component's DOM for retrieval
         * when querying the DOM. Not used directly by the component.
         */
        id: React.PropTypes.string,

        /**
         * Callback to invoke when the component is clicked.
         */
        onClick: React.PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            buttonText,
            displayClass,
            iconClass,
            id,
            onClick
        } = this.props;

        const linkClassName = `popupmenu__link ${displayClass || ''}`;

        return (
            <li className = 'popupmenu__item'>
                <a
                    className = { linkClassName }
                    id = { id }
                    onClick = { onClick }>
                    <span className = 'popupmenu__icon'>
                        <i className = { iconClass } />
                    </span>
                    <span className = 'popupmenu__text'>
                        { buttonText }
                    </span>
                </a>
            </li>
        );
    }
}
