export default {
  tx: {
    txid: '51D1916A963DDDC01A507D3323A27D59C88C9EFC0F1666E0FA4F326C451CE4C4',
    blockHash: 'C09E8EA1D6CD85AE8CFC2CF90B5D02EF79742167F0A161580077D44149616C65',
    blockHeight: 8418140,
    timestamp: 1637387732,
    confirmations: 3454641,
    fee: {
      amount: '0',
      denom: 'uosmo',
    },
    gasUsed: '66033',
    gasWanted: '1350000',
    index: 11,
    value: '',
    messages: [
      {
        origin: 'cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e',
        from: 'cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e',
        to: 'osmo1fx4jwv3aalxqwmrpymn34l582lnehr3eg40jnt',
        type: 'transfer',
        value: {
          amount: '108444',
          denom: 'uatom',
        },
      },
    ],
    events: {
      '0': {
        ibc_transfer: {
          receiver: 'osmo1fx4jwv3aalxqwmrpymn34l582lnehr3eg40jnt',
          sender: 'cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e',
        },
        message: {
          action: 'transfer',
          module: 'transfer',
          sender: 'cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e',
        },
        send_packet: {
          packet_channel_ordering: 'ORDER_UNORDERED',
          packet_connection: 'connection-257',
          packet_data:
            '{"amount":"108444","denom":"uatom","receiver":"osmo1fx4jwv3aalxqwmrpymn34l582lnehr3eg40jnt","sender":"cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e"}',
          packet_dst_channel: 'channel-0',
          packet_dst_port: 'transfer',
          packet_sequence: '154193',
          packet_src_channel: 'channel-141',
          packet_src_port: 'transfer',
          packet_timeout_height: '4-2065302',
          packet_timeout_timestamp: '0',
        },
        transfer: {
          amount: '108444uatom',
          recipient: 'cosmos1x54ltnyg88k0ejmk8ytwrhd3ltm84xehrnlslf',
          sender: 'cosmos1fx4jwv3aalxqwmrpymn34l582lnehr3eqwuz9e',
        },
      },
    },
  },
}
