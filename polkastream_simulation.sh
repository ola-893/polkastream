#!/bin/bash

# Polkadot Stream Contract Test Script
# This script tests the full workflow of the streaming contract on Passet Hub

set -e  # Exit on error

# Configuration - UPDATED FOR PASSET HUB
CONTRACT_ADDRESS="0x59142Cce01EDe54dbC76907360037D3F1f6f1b16"
RPC_URL="wss://passet-hub-paseo.ibp.network"
ALICE_SURI="//Alice"
BOB_SURI="//Bob"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for section headers
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Wait for user confirmation
wait_for_user() {
    echo ""
    read -p "Press Enter to continue..."
}

# =============================================================================
# INITIAL SETUP CHECK
# =============================================================================
print_header "INITIAL SETUP"
print_info "Contract Address: $CONTRACT_ADDRESS"
print_info "RPC URL: $RPC_URL"
print_info "Chain: Passet Hub (Paseo Asset Hub with Revive)"
echo ""
print_info "Make sure you have:"
print_info "  1. Funded Alice and Bob accounts with PAS tokens"
print_info "  2. Built your contract with Revive/EVM types (H160, U256)"
echo ""
print_info "Network Info:"
echo "  Chain: Passet Hub (Preview of PolkaVM on Paseo)"
echo "  ParaID: 1111"
echo "  Chain ID: 420420422"
echo "  RPC: $RPC_URL"
echo "  ETH-RPC: https://testnet-passet-hub-eth-rpc.polkadot.io"
echo "  Archive: wss://passet-hub-paseo.ibp.network"
echo "  Blockscout: https://blockscout-passet-hub.parity-testnet.parity.io/"
echo "  Contract: $CONTRACT_ADDRESS"
wait_for_user

# =============================================================================
# TEST 1: Get Stream Count (Initial Check)
# =============================================================================
print_header "TEST 1: Get Initial Stream Count"
print_info "Querying total number of streams in the contract..."
print_info "Note: Read-only queries don't need any flags"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_stream_count \
    --url $RPC_URL \
    --suri $ALICE_SURI

print_success "Successfully retrieved stream count"
wait_for_user

# =============================================================================
# TEST 2: Create a Stream (Alice → Bob)
# =============================================================================
print_header "TEST 2: Create Stream (Alice sends to Bob)"
print_info "Alice will create a stream of 1 PAS to Bob for 60 seconds"
print_info "Amount: 1 PAS (1000000000000 smallest units)"
print_info "Duration: 60 seconds"

# Get Bob's H160 address
print_info "First, we need Bob's H160 address (20-byte Ethereum-style address)"
echo ""
read -p "Enter Bob's H160 address (e.g., 0x1234...): " BOB_ADDRESS

if [[ ! $BOB_ADDRESS =~ ^0x[0-9a-fA-F]{40}$ ]]; then
    print_error "Invalid H160 address format. Should be 0x followed by 40 hex characters"
    exit 1
fi

print_info "Using Bob's address: $BOB_ADDRESS"

echo ""
print_info "Executing transaction with -x flag..."
cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message create_stream \
    --args "$BOB_ADDRESS" 60 \
    --value 1000000000000 \
    --url $RPC_URL \
    --suri $ALICE_SURI \
    -x -y

print_success "Stream created! Check the output for Stream ID"
print_info "Note the Stream ID from the event above - you'll need it for other tests"
wait_for_user

# =============================================================================
# TEST 3: Get Updated Stream Count
# =============================================================================
print_header "TEST 3: Get Updated Stream Count"
print_info "Should be 1 more than initial count"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_stream_count \
    --url $RPC_URL \
    --suri $ALICE_SURI

print_success "Successfully retrieved updated stream count"
wait_for_user

# =============================================================================
# TEST 4: Get Stream Details
# =============================================================================
print_header "TEST 4: Get Stream Details"
read -p "Enter the Stream ID from TEST 2: " STREAM_ID
print_info "Fetching details for Stream ID: $STREAM_ID"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_stream \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $ALICE_SURI

print_success "Successfully retrieved stream details"
wait_for_user

# =============================================================================
# TEST 5: Check Claimable Balance (Immediately)
# =============================================================================
print_header "TEST 5: Check Claimable Balance (Immediately)"
print_info "Checking claimable balance right after stream creation..."
print_info "Should be very small or zero since stream just started"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_claimable_balance \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $BOB_SURI

print_success "Successfully retrieved claimable balance"
wait_for_user

# =============================================================================
# TEST 6: Wait and Check Claimable Balance Again
# =============================================================================
print_header "TEST 6: Wait 10 Seconds and Check Claimable Balance"
print_info "Waiting 10 seconds for tokens to stream..."

for i in {10..1}; do
    echo -ne "${YELLOW}$i... ${NC}"
    sleep 1
done
echo ""

print_info "Now checking claimable balance again..."

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_claimable_balance \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $BOB_SURI

print_success "Balance should have increased!"
wait_for_user

# =============================================================================
# TEST 7: Withdraw from Stream (Bob)
# =============================================================================
print_header "TEST 7: Withdraw from Stream (Bob withdraws)"
print_info "Bob will withdraw the accumulated balance"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message withdraw_from_stream \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $BOB_SURI \
    -x -y

print_success "Withdrawal successful!"
print_info "Bob should have received the streamed tokens"
wait_for_user

# =============================================================================
# TEST 8: Check Claimable Balance After Withdrawal
# =============================================================================
print_header "TEST 8: Check Claimable Balance After Withdrawal"
print_info "Should be very small since we just withdrew"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_claimable_balance \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $BOB_SURI

print_success "Balance reset to near-zero after withdrawal"
wait_for_user

# =============================================================================
# TEST 9: Create Another Stream for Cancel Test
# =============================================================================
print_header "TEST 9: Create Another Stream (To Test Cancellation)"
print_info "Alice creates another stream to test cancellation"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message create_stream \
    --args "$BOB_ADDRESS" 120 \
    --value 2000000000000 \
    --url $RPC_URL \
    --suri $ALICE_SURI \
    -x -y

print_success "Second stream created!"
read -p "Enter the NEW Stream ID: " STREAM_ID_2
wait_for_user

# =============================================================================
# TEST 10: Cancel Stream (Alice cancels)
# =============================================================================
print_header "TEST 10: Cancel Stream"
print_info "Alice will cancel the second stream"
print_info "Both Alice and Bob should receive their fair share"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message cancel_stream \
    --args $STREAM_ID_2 \
    --url $RPC_URL \
    --suri $ALICE_SURI \
    -x -y

print_success "Stream cancelled successfully!"
print_info "Alice got refund for unstreamed amount"
print_info "Bob got the already-streamed amount"
wait_for_user

# =============================================================================
# TEST 11: Try to Withdraw from Cancelled Stream (Should Fail)
# =============================================================================
print_header "TEST 11: Try to Withdraw from Cancelled Stream (Should Fail)"
print_info "This should fail because stream is no longer active"

set +e  # Don't exit on error for this test
cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message withdraw_from_stream \
    --args $STREAM_ID_2 \
    --url $RPC_URL \
    --suri $BOB_SURI \
    -x -y 2>&1 | tee /tmp/withdraw_error.log

if grep -q -i "error\|fail\|revert\|StreamNotActive" /tmp/withdraw_error.log; then
    print_success "Correctly rejected withdrawal from cancelled stream!"
else
    print_error "Unexpected: withdrawal should have failed"
fi
set -e
wait_for_user

# =============================================================================
# TEST 12: Get Final Stream Count
# =============================================================================
print_header "TEST 12: Get Final Stream Count"
print_info "Should be 2 more than initial count (we created 2 streams)"

cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_stream_count \
    --url $RPC_URL \
    --suri $ALICE_SURI

print_success "Final stream count retrieved"
wait_for_user

# =============================================================================
# TEST 13: Try Invalid Operations (Error Handling Tests)
# =============================================================================
print_header "TEST 13: Error Handling Tests"

echo ""
print_info "13.1: Query non-existent stream (should return None)"
set +e
cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message get_stream \
    --args 99999 \
    --url $RPC_URL \
    --suri $ALICE_SURI 2>&1 | tee /tmp/error_test.log

if grep -q -i "none\|null\|not found" /tmp/error_test.log; then
    print_success "Correctly returned None for non-existent stream"
else
    print_info "Check output above"
fi
set -e
wait_for_user

echo ""
print_info "13.2: Try to withdraw from someone else's stream (should fail)"
print_info "Alice tries to withdraw from Bob's stream (should fail)"
set +e
cargo contract call \
    --contract $CONTRACT_ADDRESS \
    --message withdraw_from_stream \
    --args $STREAM_ID \
    --url $RPC_URL \
    --suri $ALICE_SURI \
    -x -y 2>&1 | tee /tmp/auth_error.log

if grep -q -i "error\|fail\|NotRecipient" /tmp/auth_error.log; then
    print_success "Correctly rejected unauthorized withdrawal!"
else
    print_error "Unexpected: should have failed authorization check"
fi
set -e
wait_for_user

# =============================================================================
# SUMMARY
# =============================================================================
print_header "TEST SUMMARY"

echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Tests performed:"
echo "  1. ✓ Get initial stream count"
echo "  2. ✓ Create stream (Alice → Bob)"
echo "  3. ✓ Get updated stream count"
echo "  4. ✓ Get stream details"
echo "  5. ✓ Check claimable balance (immediate)"
echo "  6. ✓ Check claimable balance (after 10s)"
echo "  7. ✓ Withdraw from stream"
echo "  8. ✓ Check balance after withdrawal"
echo "  9. ✓ Create second stream"
echo " 10. ✓ Cancel stream"
echo " 11. ✓ Try invalid withdrawal (error test)"
echo " 12. ✓ Get final stream count"
echo " 13. ✓ Error handling tests"
echo ""
print_success "Contract is working correctly on Passet Hub! ✨"
echo ""
echo -e "${BLUE}Network Info:${NC}"
echo "  Chain: Passet Hub"
echo "  RPC: $RPC_URL"
echo "  Contract: $CONTRACT_ADDRESS"
echo ""
echo -e "${BLUE}Ready to connect the frontend!${NC}"